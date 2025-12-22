-- ==========================================
-- SKARBIEC DZIECKA - DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Created: 2025-12-19
-- ==========================================

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
-- Extends auth.users with additional profile data

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,

  -- Web3 wallet info (optional - user can connect MetaMask later)
  wallet_address TEXT,
  has_web3_wallet BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_email_key UNIQUE(email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and update their own data only
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policy: Allow insert on signup
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. TREASURIES TABLE
-- ==========================================
-- Stores information about each child's treasury vault

CREATE TABLE IF NOT EXISTS public.treasuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Blockchain data
  contract_address TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL DEFAULT 84532, -- Base Sepolia testnet

  -- Child information
  child_name TEXT NOT NULL,
  child_birth_date BIGINT NOT NULL, -- Unix timestamp

  -- Owner information
  owner_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  owner_wallet_address TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Deployment info
  deployment_tx_hash TEXT,
  factory_address TEXT,

  -- Stats (updated by triggers or functions)
  total_contributions_count INTEGER DEFAULT 0,
  total_eth_balance DECIMAL(18, 8) DEFAULT 0,

  -- Constraints
  CONSTRAINT treasuries_contract_address_key UNIQUE(contract_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treasuries_owner ON public.treasuries(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_treasuries_contract ON public.treasuries(contract_address);
CREATE INDEX IF NOT EXISTS idx_treasuries_wallet ON public.treasuries(owner_wallet_address);

-- Enable RLS
ALTER TABLE public.treasuries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view treasuries (public pages)
CREATE POLICY "Anyone can view treasuries"
  ON public.treasuries
  FOR SELECT
  USING (true);

-- RLS Policy: Only owner can update their treasuries
CREATE POLICY "Owner can update treasury"
  ON public.treasuries
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- RLS Policy: Authenticated users can create treasuries
CREATE POLICY "Authenticated users can create treasuries"
  ON public.treasuries
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- ==========================================
-- 3. CONTRIBUTIONS TABLE
-- ==========================================
-- Tracks all deposits/contributions to treasuries

CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Treasury reference
  treasury_id UUID REFERENCES public.treasuries(id) ON DELETE CASCADE,
  treasury_address TEXT NOT NULL, -- Denormalized for faster queries

  -- Contributor data
  contributor_name TEXT NOT NULL,
  contributor_wallet TEXT, -- NULL if via Stripe (custodial)

  -- Payment data
  amount_eth DECIMAL(18, 8) NOT NULL,
  amount_pln DECIMAL(10, 2), -- Only if paid via Stripe
  payment_method TEXT NOT NULL, -- 'metamask' | 'stripe' | 'ramp' | 'direct'

  -- Blockchain data
  tx_hash TEXT,
  block_number BIGINT,
  token_address TEXT DEFAULT '0x0000000000000000000000000000000000000000', -- ETH

  -- Stripe data (if payment_method = 'stripe')
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT contributions_tx_hash_key UNIQUE(tx_hash),
  CONSTRAINT contributions_payment_method_check
    CHECK (payment_method IN ('metamask', 'stripe', 'ramp', 'direct'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contributions_treasury ON public.contributions(treasury_id);
CREATE INDEX IF NOT EXISTS idx_contributions_treasury_addr ON public.contributions(treasury_address);
CREATE INDEX IF NOT EXISTS idx_contributions_tx ON public.contributions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_contributions_created ON public.contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_stripe ON public.contributions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view contributions (public data)
CREATE POLICY "Anyone can view contributions"
  ON public.contributions
  FOR SELECT
  USING (true);

-- RLS Policy: System can insert contributions (via API)
CREATE POLICY "System can insert contributions"
  ON public.contributions
  FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- 4. WITHDRAWALS TABLE
-- ==========================================
-- Tracks withdrawals by treasury owners

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Treasury reference
  treasury_id UUID REFERENCES public.treasuries(id) ON DELETE CASCADE,
  treasury_address TEXT NOT NULL,

  -- Withdrawal data
  amount_eth DECIMAL(18, 8) NOT NULL,
  destination_address TEXT NOT NULL,
  reason TEXT, -- Optional: "Wakacje dla Olafa"

  -- Blockchain data
  tx_hash TEXT NOT NULL,
  block_number BIGINT,

  -- User who withdrew
  withdrawn_by_user_id UUID REFERENCES public.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT withdrawals_tx_hash_key UNIQUE(tx_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_withdrawals_treasury ON public.withdrawals(treasury_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(withdrawn_by_user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_tx ON public.withdrawals(tx_hash);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only owner can view their withdrawals
CREATE POLICY "Owner can view withdrawals"
  ON public.withdrawals
  FOR SELECT
  USING (
    auth.uid() = withdrawn_by_user_id OR
    EXISTS (
      SELECT 1 FROM public.treasuries
      WHERE treasuries.id = withdrawals.treasury_id
      AND treasuries.owner_user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert withdrawals
CREATE POLICY "System can insert withdrawals"
  ON public.withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = withdrawn_by_user_id);

-- ==========================================
-- 5. NOTIFICATIONS TABLE
-- ==========================================
-- Stores user notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  treasury_id UUID REFERENCES public.treasuries(id) ON DELETE CASCADE,

  -- Notification data
  type TEXT NOT NULL, -- 'contribution' | 'withdrawal' | 'milestone' | 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Metadata
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT notifications_type_check
    CHECK (type IN ('contribution', 'withdrawal', 'milestone', 'system'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read)
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users see own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================
-- 6. FUNCTIONS & TRIGGERS
-- ==========================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update users.updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update treasuries.updated_at
CREATE TRIGGER update_treasuries_updated_at
  BEFORE UPDATE ON public.treasuries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 7. INITIAL DATA (Optional)
-- ==========================================

-- You can add test data here if needed

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Verify tables were created
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('users', 'treasuries', 'contributions', 'withdrawals', 'notifications')
ORDER BY table_name;

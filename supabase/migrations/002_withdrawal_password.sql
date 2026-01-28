-- ==========================================
-- SKARBIEC DZIECKA - WITHDRAWAL PASSWORD
-- Migration: 002_withdrawal_password.sql
-- Created: 2025-01-28
-- ==========================================

-- Add withdrawal password hash column to treasuries
-- This stores a bcrypt hash of the 4-word passphrase
-- The passphrase is shown ONCE during treasury creation
-- User must enter it to withdraw funds (2FA for withdrawals)

ALTER TABLE public.treasuries
ADD COLUMN IF NOT EXISTS withdrawal_password_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.treasuries.withdrawal_password_hash IS
  'Bcrypt hash of withdrawal passphrase. Generated at treasury creation, shown once to user. Required for all withdrawals.';

-- Update notification types to include new type
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('contribution', 'withdrawal', 'milestone', 'system', 'treasury_created', 'security'));

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

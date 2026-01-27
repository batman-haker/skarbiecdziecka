'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatEther, parseEther, isAddress } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import QRCode from 'qrcode';
import TreasuryVaultABI from '@/lib/contracts/TreasuryVault.json';

// Emojis dla różnych wpłacających
const CONTRIBUTOR_EMOJIS = ['👵', '👴', '👨', '👩', '🧑', '👦', '👧', '🧒', '👶'];

// Type for contribution data
type ContributionData = readonly [
  string, // contributor address
  bigint, // amount
  string, // relation
  bigint, // timestamp
  string  // contributorName
];

// Component dla pojedynczej wpłaty
function ContributionItem({ treasuryAddress, index }: { treasuryAddress: `0x${string}`, index: number }) {
  const { data: contribution } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getContribution',
    args: [BigInt(index)],
    chainId: baseSepolia.id,
  }) as { data: ContributionData | undefined };

  if (!contribution) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg animate-pulse">
        <span className="text-gray-400 font-mono text-sm">Wczytywanie...</span>
      </div>
    );
  }

  const emoji = CONTRIBUTOR_EMOJIS[index % CONTRIBUTOR_EMOJIS.length];
  const colors = [
    'border-pink-500/30 hover:border-pink-500/60',
    'border-cyan-500/30 hover:border-cyan-500/60',
    'border-purple-500/30 hover:border-purple-500/60',
    'border-yellow-500/30 hover:border-yellow-500/60',
    'border-green-500/30 hover:border-green-500/60',
  ];
  const color = colors[index % colors.length];

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-800/50 border ${color} rounded-lg transition-all`}>
      <div className="flex items-center gap-4">
        <div className="text-3xl">{emoji}</div>
        <div>
          <p className="font-semibold text-white">{contribution[4]}</p>
          <p className="text-sm text-gray-400">
            {new Date(Number(contribution[3]) * 1000).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold text-green-400">
          +{formatEther(contribution[1])} ETH
        </p>
        <p className="text-xs text-gray-500">
          ~{(parseFloat(formatEther(contribution[1])) * 10000).toFixed(0)} PLN
        </p>
      </div>
    </div>
  );
}

export default function TreasuryContent() {
  const params = useParams();
  const addressParam = params.address as string;

  // Validate address
  const isValidAddress = addressParam && isAddress(addressParam);
  const treasuryAddress = isValidAddress ? (addressParam as `0x${string}`) : null;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [depositAmount, setDepositAmount] = useState('0.01');
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Withdraw state
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Privy hooks - for logged in users (parent/owner)
  const { ready: privyReady, authenticated: privyAuthenticated, login: privyLogin } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const privyWalletAddress = privyWallets.length > 0 ? privyWallets[0].address : null;

  // Wagmi hooks - for external visitors (MetaMask deposits)
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Separate hooks for withdraw operations
  const { writeContract: writeWithdraw, data: withdrawHash, isPending: isWithdrawPending } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  // Read treasury data - MUST specify chainId for Base Sepolia
  const { data: childName, isError: childNameError, isLoading: childNameLoading, isFetching: childNameFetching } = useReadContract({
    address: treasuryAddress!,
    abi: TreasuryVaultABI,
    functionName: 'childName',
    chainId: baseSepolia.id,
    query: {
      enabled: !!treasuryAddress,
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000, // Cache for 30 seconds
    }
  });

  const { data: birthDate } = useReadContract({
    address: treasuryAddress!,
    abi: TreasuryVaultABI,
    functionName: 'birthDate',
    chainId: baseSepolia.id,
    query: {
      enabled: !!treasuryAddress,
      staleTime: 60000, // Cache for 1 minute (birthDate never changes)
    }
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: treasuryAddress!,
    abi: TreasuryVaultABI,
    functionName: 'getETHBalance',
    chainId: baseSepolia.id,
    query: {
      enabled: !!treasuryAddress,
      staleTime: 10000, // Cache for 10 seconds
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    }
  });

  const { data: contributionsCount, refetch: refetchCount } = useReadContract({
    address: treasuryAddress!,
    abi: TreasuryVaultABI,
    functionName: 'getContributionsCount',
    chainId: baseSepolia.id,
    query: {
      enabled: !!treasuryAddress,
      staleTime: 10000,
    }
  });

  // Read owner address - to check if current user is the parent
  const { data: ownerAddress, isLoading: ownerLoading } = useReadContract({
    address: treasuryAddress!,
    abi: TreasuryVaultABI,
    functionName: 'owner',
    chainId: baseSepolia.id,
    query: {
      enabled: !!treasuryAddress,
      staleTime: 60000, // Cache for 1 minute (owner rarely changes)
      retry: 3,
      retryDelay: 1000,
    }
  });

  // Check if logged-in Privy user is the owner (parent)
  // Priority: Privy wallet (embedded) > MetaMask wallet
  const isOwner: boolean = Boolean(
    ownerAddress && (
      // Check Privy embedded wallet first (for logged-in parents)
      (privyAuthenticated && privyWalletAddress &&
        privyWalletAddress.toLowerCase() === (ownerAddress as string).toLowerCase()) ||
      // Fallback to MetaMask (if connected)
      (isConnected && address &&
        address.toLowerCase() === (ownerAddress as string).toLowerCase())
    )
  );

  // Debug: log addresses for troubleshooting
  useEffect(() => {
    if (privyReady) {
      console.log('[Treasury Debug]', {
        privyAuthenticated,
        privyWalletAddress,
        ownerAddress,
        wagmiAddress: address,
        isConnected,
        isOwner,
        match: privyWalletAddress && ownerAddress ?
          privyWalletAddress.toLowerCase() === (ownerAddress as string).toLowerCase() : false
      });
    }
  }, [privyReady, privyAuthenticated, privyWalletAddress, ownerAddress, address, isConnected, isOwner]);

  // Calculate age
  const childAge = birthDate ? Math.floor((Date.now() / 1000 - Number(birthDate)) / (365 * 24 * 60 * 60)) : null;
  const yearsTo18 = childAge !== null ? Math.max(0, 18 - childAge) : null;

  // Calculate maturity date
  const maturityDate = birthDate ? new Date((Number(birthDate) + 18 * 365 * 24 * 60 * 60) * 1000) : null;

  // Generate QR code
  useEffect(() => {
    if (treasuryAddress) {
      QRCode.toDataURL(treasuryAddress, {
        width: 200,
        margin: 2,
        color: { dark: '#06b6d4', light: '#1f2937' },
      }).then(setQrCodeUrl);
    }
  }, [treasuryAddress]);

  // Reset after successful deposit
  useEffect(() => {
    if (isSuccess) {
      setShowDepositForm(false);
      setContributorName('');
      setDepositAmount('0.01');
      setTimeout(() => {
        refetchBalance();
        refetchCount();
      }, 2000);
    }
  }, [isSuccess, refetchBalance, refetchCount]);

  // Reset after successful withdraw
  useEffect(() => {
    if (isWithdrawSuccess) {
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setTimeout(() => {
        refetchBalance();
        setWithdrawSuccess(false);
      }, 3000);
    }
  }, [isWithdrawSuccess, refetchBalance]);

  // Copy address
  const copyAddress = () => {
    if (treasuryAddress) {
      navigator.clipboard.writeText(treasuryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy shareable link
  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!contributorName.trim()) {
      alert('Wpisz swoje imię!');
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Wpisz poprawną kwotę!');
      return;
    }
    if (!treasuryAddress) return;

    try {
      writeContract({
        address: treasuryAddress,
        abi: TreasuryVaultABI,
        functionName: 'depositETH',
        args: [contributorName],
        value: parseEther(depositAmount),
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error('Deposit error:', error);
      alert('Wystąpił błąd! Sprawdź console.');
    }
  };

  // Handle withdraw specific amount
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Wpisz poprawną kwotę do wypłaty!');
      return;
    }
    if (!treasuryAddress) return;

    try {
      writeWithdraw({
        address: treasuryAddress,
        abi: TreasuryVaultABI,
        functionName: 'withdrawETH',
        args: [parseEther(withdrawAmount)],
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error('Withdraw error:', error);
      alert('Wystąpił błąd wypłaty! Sprawdź console.');
    }
  };

  // Handle withdraw all ETH
  const handleWithdrawAll = async () => {
    if (!treasuryAddress) return;

    try {
      writeWithdraw({
        address: treasuryAddress,
        abi: TreasuryVaultABI,
        functionName: 'withdrawAllETH',
        args: [],
        chainId: baseSepolia.id,
      });
    } catch (error) {
      console.error('Withdraw all error:', error);
      alert('Wystąpił błąd wypłaty! Sprawdź console.');
    }
  };

  // Invalid address
  if (!isValidAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Nieprawidłowy adres</h1>
          <p className="text-gray-400 mb-6">Podany adres skarbca jest nieprawidłowy.</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 underline">
            Wróć na stronę główną
          </a>
        </div>
      </div>
    );
  }

  // Loading state - show spinner while initial data is being fetched
  if (childNameLoading || (childNameFetching && !childName)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🎁</div>
          <p className="text-cyan-400 font-mono">Ładowanie skarbca...</p>
          <p className="text-gray-500 text-xs mt-2 font-mono">{treasuryAddress}</p>
        </div>
      </div>
    );
  }

  // Treasury not found - only show if we have an error AND no data AND not loading
  if (childNameError && !childName && !childNameLoading && !childNameFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">Skarbiec nie znaleziony</h1>
          <p className="text-gray-400 mb-2">Pod tym adresem nie ma skarbca.</p>
          <p className="text-gray-500 text-sm mb-6 font-mono">{treasuryAddress}</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 underline">
            Wróć na stronę główną
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
            Skarbiec {childName ? String(childName) : '...'}
          </h1>
          {childAge !== null && (
            <p className="text-cyan-300/70">
              {childAge} {childAge === 1 ? 'rok' : childAge < 5 ? 'lata' : 'lat'} •
              {yearsTo18 !== null && yearsTo18 > 0 ? ` ${yearsTo18} lat do pełnoletności` : ' Pełnoletni!'}
            </p>
          )}
        </div>

        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-xl border border-green-500/30 p-8 mb-8 text-center">
          <p className="text-green-300 text-sm mb-2">Zebrane środki</p>
          <p className="text-5xl font-bold text-white mb-2">
            {balance ? formatEther(balance as bigint) : '0.0'} ETH
          </p>
          <p className="text-gray-400">
            ~{balance ? (parseFloat(formatEther(balance as bigint)) * 10000).toFixed(0) : '0'} PLN
          </p>
          {maturityDate && (
            <p className="text-cyan-300/60 text-sm mt-4">
              Dostępne od: {maturityDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Owner Badge */}
        {isOwner && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <div>
                  <span className="text-yellow-400 text-sm font-bold">Jesteś właścicielem tego skarbca</span>
                  <p className="text-gray-400 text-xs">
                    {privyAuthenticated ? 'Zalogowano przez Google' : 'Połączono przez MetaMask'}
                  </p>
                </div>
              </div>
              <span className="text-xs text-yellow-300 font-mono">
                {privyWalletAddress ? `${privyWalletAddress.slice(0, 6)}...${privyWalletAddress.slice(-4)}` : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Login prompt for potential owners */}
        {!isOwner && !privyAuthenticated && privyReady && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Jesteś rodzicem tego dziecka?</p>
                <p className="text-gray-500 text-xs">Zaloguj się aby zarządzać skarbcem</p>
              </div>
              <button
                onClick={() => privyLogin()}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
              >
                Zaloguj przez Google
              </button>
            </div>
          </div>
        )}

        {/* DEBUG: Address comparison - remove in production */}
        {privyAuthenticated && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-xs font-mono">
            <p className="text-red-400 font-bold mb-2">🔧 DEBUG INFO (usuń w produkcji)</p>
            <p className="text-gray-400">Privy auth: <span className="text-green-400">{privyAuthenticated ? 'TAK' : 'NIE'}</span></p>
            <p className="text-gray-400">Twój wallet: <span className="text-cyan-400">{privyWalletAddress || 'brak'}</span></p>
            <p className="text-gray-400">Owner skarbca: <span className="text-yellow-400">
              {ownerLoading ? '⏳ ładowanie...' : ownerAddress ? String(ownerAddress) : '❌ błąd odczytu'}
            </span></p>
            <p className="text-gray-400">Match: <span className={isOwner ? 'text-green-400' : 'text-red-400'}>{isOwner ? 'TAK ✓' : 'NIE ✗'}</span></p>
            {privyWalletAddress && ownerAddress && !isOwner && (
              <p className="text-orange-400 mt-2">
                ⚠️ Adresy nie pasują! Privy: {privyWalletAddress.toLowerCase().slice(0, 10)}... vs Owner: {String(ownerAddress).toLowerCase().slice(0, 10)}...
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`grid gap-4 mb-8 ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            onClick={() => setShowDepositForm(!showDepositForm)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30"
          >
            💝 Wpłać na skarbiec
          </button>
          {isOwner && (
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/30"
            >
              💰 Wypłać środki
            </button>
          )}
          <button
            onClick={copyLink}
            className="bg-gray-800/80 hover:bg-gray-700/80 text-cyan-400 font-bold py-4 px-6 rounded-xl transition-all border border-cyan-500/30 hover:border-cyan-500/60"
          >
            {copiedLink ? '✓ Skopiowano!' : '🔗 Udostępnij link'}
          </button>
        </div>

        {/* Deposit Form */}
        {showDepositForm && (
          <div className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-purple-400 mb-4">
              Wpłać na skarbiec {childName ? String(childName) : ''}
            </h2>

            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm mb-4">
                  Połącz portfel MetaMask aby wpłacić środki
                </p>
                {connectors.filter(c => c.id === 'metaMask' || c.id === 'injected').map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    🦊 Połącz MetaMask
                  </button>
                ))}
                <p className="text-gray-500 text-xs text-center">
                  Nie masz MetaMask? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Pobierz tutaj</a>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-green-400 text-sm">✓ Portfel połączony</span>
                  <button onClick={() => disconnect()} className="text-red-400 text-xs hover:underline">
                    Rozłącz
                  </button>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Twoje imię (widoczne publicznie)</label>
                  <input
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="np. Babcia Ania, Wujek Tomek"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Kwota (ETH)</label>
                  <div className="flex gap-2">
                    {['0.01', '0.05', '0.1', '0.5'].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDepositAmount(amount)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          depositAmount === amount
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {amount} ETH
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    ~{(parseFloat(depositAmount || '0') * 10000).toFixed(0)} PLN
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {isPending ? '⏳ Podpisywanie...' :
                   isConfirming ? '⏳ Przetwarzanie...' :
                   `💝 Wpłać ${depositAmount} ETH`}
                </button>

                {hash && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      ⏳ Transakcja: {hash.slice(0, 10)}...{hash.slice(-8)}
                    </p>
                  </div>
                )}

                {isSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <p className="text-green-400 font-bold mb-1">✓ Wpłata zakończona!</p>
                    <p className="text-gray-400 text-sm">
                      Dziękujemy za wsparcie {childName ? String(childName) : 'dziecka'}!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Withdraw Form - Only for Owner */}
        {showWithdrawForm && isOwner && (
          <div className="bg-gray-800/50 rounded-xl border border-orange-500/30 p-6 mb-8">
            <h2 className="text-xl font-bold text-orange-400 mb-4">
              💰 Wypłać środki ze skarbca
            </h2>

            {/* Privy wallet info */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-400 text-sm font-bold">✓ Zalogowany przez Google</span>
                  <p className="text-gray-400 text-xs mt-1">
                    Portfel: {privyWalletAddress ? `${privyWalletAddress.slice(0, 8)}...${privyWalletAddress.slice(-6)}` : 'Ładowanie...'}
                  </p>
                </div>
                <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">Właściciel</span>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
              <p className="text-orange-300 text-sm">
                <strong>Uwaga:</strong> Środki zostaną przelane na Twój portfel Privy.
                Aktualnie dostępne: <strong>{balance ? formatEther(balance as bigint) : '0'} ETH</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Kwota do wypłaty (ETH)</label>
                <div className="flex gap-2 mb-2">
                  {balance ? [0.25, 0.5, 0.75, 1].map((percent) => {
                    const amount = (parseFloat(formatEther(balance as bigint)) * percent).toFixed(4);
                    return (
                      <button
                        key={percent}
                        onClick={() => setWithdrawAmount(amount)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          withdrawAmount === amount
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {Math.round(percent * 100)}%
                      </button>
                    );
                  }) : null}
                </div>
                <input
                  type="number"
                  step="0.0001"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawPending || isWithdrawConfirming || !withdrawAmount}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {isWithdrawPending ? '⏳ Podpisywanie...' :
                   isWithdrawConfirming ? '⏳ Przetwarzanie...' :
                   `Wypłać ${withdrawAmount || '0'} ETH`}
                </button>
                <button
                  onClick={handleWithdrawAll}
                  disabled={isWithdrawPending || isWithdrawConfirming || !balance || balance === 0n}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {isWithdrawPending ? '⏳...' :
                   isWithdrawConfirming ? '⏳...' :
                   '💸 Wypłać wszystko'}
                </button>
              </div>

              {withdrawHash && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-sm">
                    ⏳ Transakcja: {withdrawHash.slice(0, 10)}...{withdrawHash.slice(-8)}
                  </p>
                </div>
              )}

              {withdrawSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-bold mb-1">✓ Wypłata zakończona!</p>
                  <p className="text-gray-400 text-sm">
                    Środki zostały przelane na Twój portfel.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code & Address */}
        <div className="bg-gray-800/50 rounded-xl border border-cyan-500/30 p-6 mb-8">
          <h2 className="text-lg font-bold text-cyan-400 mb-4 text-center">Adres skarbca</h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {qrCodeUrl && (
              <div className="p-3 bg-gray-900 rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <p className="text-gray-400 text-xs mb-2">Adres kontraktu (Base Sepolia)</p>
              <p className="text-cyan-300 font-mono text-sm break-all mb-4">
                {treasuryAddress}
              </p>
              <button
                onClick={copyAddress}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
              >
                {copied ? '✓ Skopiowano!' : '📋 Kopiuj adres'}
              </button>
            </div>
          </div>
        </div>

        {/* Contributions History */}
        <div className="bg-gray-800/50 rounded-xl border border-purple-500/30 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-purple-400">Historia wpłat</h2>
            <span className="text-gray-400 text-sm">
              {contributionsCount ? String(contributionsCount) : '0'} wpłat
            </span>
          </div>

          {contributionsCount && Number(contributionsCount) > 0 ? (
            <div className="space-y-3">
              {Array.from({ length: Number(contributionsCount) }, (_, i) => (
                <ContributionItem key={i} treasuryAddress={treasuryAddress!} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-gray-500">Brak wpłat</p>
              <p className="text-gray-600 text-sm">Bądź pierwszy!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Skarbiec Dziecka • Powered by Base L2</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300">
            Utwórz własny skarbiec
          </a>
        </div>
      </div>
    </div>
  );
}

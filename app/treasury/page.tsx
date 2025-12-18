'use client';

/**
 * Strona Skarbca - Dynamiczna
 * Pokazuje: adres, QR code, saldo, historię wpłat
 * Pozwala wpłacać przez MetaMask/Wallet
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import QRCode from 'qrcode';
import TreasuryVaultABI from '@/lib/contracts/TreasuryVault.json';

// Adres skarbca Olafa jako fallback
const OLAF_TREASURY = '0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968';

// Emojis dla różnych wpłacających
const CONTRIBUTOR_EMOJIS = ['👵', '👨', '👩', '🧑', '👴', '👶', '🧒', '👦', '👧'];

// Kolory dla różnych wpłat
const CONTRIBUTION_COLORS = [
  'from-pink-50 to-rose-50 border-pink-200',
  'from-blue-50 to-indigo-50 border-blue-200',
  'from-green-50 to-emerald-50 border-green-200',
  'from-purple-50 to-violet-50 border-purple-200',
  'from-yellow-50 to-amber-50 border-yellow-200',
];

// Component dla pojedynczej wpłaty - CYBERPUNK STYLE
function ContributionItem({ treasuryAddress, index }: { treasuryAddress: `0x${string}`, index: number }) {
  const { data: contribution } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getContribution',
    args: [BigInt(index)],
  });

  if (!contribution) {
    return (
      <div className="flex items-center justify-center p-4 bg-cyber-darker border-2 border-cyber-border rounded-lg animate-pulse">
        <span className="text-gray-400 font-mono">LOADING_TX...</span>
      </div>
    );
  }

  const emoji = CONTRIBUTOR_EMOJIS[index % CONTRIBUTOR_EMOJIS.length];

  // Różne style dla różnych wpłat
  const styles = [
    { border: 'border-neon-pink', text: 'text-neon-pink', glow: 'hover:shadow-neon-pink' },
    { border: 'border-neon-cyan', text: 'text-neon-cyan', glow: 'hover:shadow-neon-cyan' },
    { border: 'border-neon-purple', text: 'text-neon-purple', glow: 'hover:shadow-neon-purple' },
    { border: 'border-neon-yellow', text: 'text-neon-yellow', glow: 'hover:shadow-neon-yellow' },
    { border: 'border-neon-green', text: 'text-neon-green', glow: 'hover:shadow-neon-green' },
  ];

  const style = styles[index % styles.length];

  return (
    <div className={`flex items-center justify-between p-4 bg-cyber-darker border-2 ${style.border} rounded-lg ${style.glow} transition-all relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-5"></div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="text-4xl">{emoji}</div>
        <div>
          <p className={`font-semibold ${style.text} font-mono`}>
            {contribution[4]}
          </p>
          <p className="text-sm text-gray-400 font-mono">
            {new Date(Number(contribution[3]) * 1000).toLocaleDateString('pl-PL')}
          </p>
        </div>
      </div>
      <div className="relative z-10 text-right">
        <p className="text-2xl font-bold text-neon-green font-mono">
          +{formatEther(contribution[1])} ETH
        </p>
        <p className="text-xs text-gray-500 font-mono">
          ≈ {(parseFloat(formatEther(contribution[1])) * 10000).toFixed(2)} PLN
        </p>
      </div>
    </div>
  );
}

function TreasuryPageContent() {
  const searchParams = useSearchParams();
  const treasuryAddress = (searchParams.get('address') || OLAF_TREASURY) as `0x${string}`;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [contributorName, setContributorName] = useState('');
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Odczyt danych z blockchainu
  const { data: childName } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'childName',
  });

  const { data: birthDate } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'birthDate',
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getETHBalance',
  });

  const { data: contributionsCount, refetch: refetchCount } = useReadContract({
    address: treasuryAddress,
    abi: TreasuryVaultABI,
    functionName: 'getContributionsCount',
  });

  // Oblicz wiek dziecka z birthDate
  const childAge = birthDate ? Math.floor((Date.now() / 1000 - Number(birthDate)) / (365 * 24 * 60 * 60)) : 5;
  const yearsTo18 = Math.max(0, 18 - childAge);

  // Generuj QR code przy zmianie adresu
  useEffect(() => {
    QRCode.toDataURL(treasuryAddress, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff',
      },
    }).then(setQrCodeUrl);
  }, [treasuryAddress]);

  // Reset success state when address changes
  useEffect(() => {
    if (isSuccess) {
      setShowDepositForm(false);
      setContributorName('');
      setDepositAmount('0.1');
      // Refetch data after successful deposit
      setTimeout(() => {
        refetchBalance();
        refetchCount();
      }, 2000);
    }
  }, [isSuccess, refetchBalance, refetchCount]);

  // Kopiuj adres
  const copyAddress = () => {
    navigator.clipboard.writeText(treasuryAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handler: Wpłać ETH
  const handleDeposit = async () => {
    if (!contributorName || !depositAmount) {
      alert('Wypełnij wszystkie pola!');
      return;
    }

    try {
      writeContract({
        address: treasuryAddress,
        abi: TreasuryVaultABI,
        functionName: 'depositETH',
        args: [contributorName],
        value: parseEther(depositAmount),
      });
    } catch (error) {
      console.error('Błąd wpłaty:', error);
      alert('Wystąpił błąd! Zobacz console.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-darker to-cyber-dark opacity-50"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255, 0, 110, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-scan"></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h1 className="text-5xl font-bold mb-2 animate-flicker">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan font-mono">
                VAULT [{childName ? String(childName).toUpperCase() : 'LOADING'}]
              </span>
            </h1>
            <p className="text-xl text-neon-cyan font-mono">
              {childName ? String(childName) : 'Ładowanie...'} • AGE: {childAge} {childAge === 1 ? 'rok' : childAge < 5 ? 'lata' : 'lat'}
            </p>
            <div className="mt-4 inline-block px-4 py-1 border border-neon-green rounded text-neon-green text-sm font-mono">
              STATUS: ACTIVE • BLOCKCHAIN: BASE_L2
            </div>
          </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Lewy panel: Adres + QR */}
          <div className="bg-cyber-card border-2 border-neon-cyan rounded-lg shadow-neon-cyan p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"></div>

            <h2 className="text-2xl font-bold mb-6 text-center text-neon-cyan font-mono">
              &gt; VAULT_ADDRESS
            </h2>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              {qrCodeUrl ? (
                <div className="p-4 bg-white rounded-xl shadow-neon-purple border-2 border-neon-purple">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-[300px] h-[300px] bg-cyber-darker rounded-xl animate-pulse flex items-center justify-center border-2 border-cyber-border">
                  <span className="text-gray-400 font-mono">GENERATING_QR...</span>
                </div>
              )}
            </div>

            {/* Adres */}
            <div className="bg-cyber-darker border-2 border-cyber-border rounded-lg p-4 mb-4">
              <p className="text-xs text-neon-cyan mb-2 text-center font-mono">
                CONTRACT_ADDRESS:
              </p>
              <p className="text-sm font-mono text-neon-pink break-all text-center">
                {treasuryAddress}
              </p>
            </div>

            {/* Przycisk kopiuj */}
            <button
              onClick={copyAddress}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:shadow-neon-cyan text-white font-bold py-3 rounded-lg transition-all border-2 border-neon-cyan font-mono"
            >
              {copied ? '✓ COPIED!' : '&gt; COPY_ADDRESS'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4 font-mono">
              // Send ETH to this address
            </p>
          </div>

          {/* Prawy panel: Saldo + Info */}
          <div className="space-y-6">
            {/* Saldo */}
            <div className="bg-gradient-to-br from-neon-green via-neon-cyan to-neon-purple rounded-lg shadow-neon-green p-8 text-white border-2 border-neon-green relative overflow-hidden animate-glow">
              <div className="absolute inset-0 bg-cyber-darker opacity-80"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold mb-2 opacity-90 font-mono">
                  BALANCE:
                </h2>
                <div className="text-5xl font-bold mb-2 font-mono">
                  {balance ? formatEther(balance as bigint) : '0.0'} ETH
                </div>
                <p className="text-sm opacity-90 font-mono">
                  ≈ {balance ? (parseFloat(formatEther(balance as bigint)) * 10000).toFixed(2) : '0'} PLN
                  <span className="text-xs ml-1">(1 ETH ≈ 10k PLN)</span>
                </p>
              </div>
            </div>

            {/* Liczba wpłat */}
            <div className="bg-cyber-card border-2 border-neon-purple rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neon-purple font-mono">
                  &gt; STATISTICS
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono">DEPOSITS:</span>
                  <span className="font-bold text-xl text-neon-cyan font-mono">
                    {contributionsCount ? String(contributionsCount) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono">CHILD_AGE:</span>
                  <span className="font-semibold text-neon-pink font-mono">{childAge} {childAge === 1 ? 'rok' : childAge < 5 ? 'lata' : 'lat'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-mono">YEARS_TO_18:</span>
                  <span className="font-semibold text-neon-yellow font-mono">{yearsTo18} {yearsTo18 === 1 ? 'rok' : yearsTo18 < 5 ? 'lata' : 'lat'}</span>
                </div>
              </div>
            </div>

            {/* Przycisk wpłaty */}
            <button
              onClick={() => setShowDepositForm(!showDepositForm)}
              className="w-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan hover:shadow-neon-pink text-white font-bold py-4 px-6 rounded-lg transition-all border-2 border-neon-pink font-mono uppercase tracking-wider animate-glow"
            >
              ⚡ DEPOSIT &gt; {childName ? String(childName).toUpperCase() : 'CHILD'}
            </button>
          </div>
        </div>

        {/* Deposit Form */}
        {showDepositForm && (
          <div className="bg-cyber-card border-2 border-neon-green rounded-lg shadow-neon-green p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple"></div>

            <h2 className="text-2xl font-bold mb-6 text-neon-green font-mono">
              &gt; DEPOSIT_ETH
            </h2>

            {!isConnected ? (
              <div className="space-y-4">
                <p className="text-gray-400 mb-4 font-mono">
                  // Connect wallet to deposit funds
                </p>
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="w-full bg-gradient-to-r from-neon-pink to-neon-purple hover:shadow-neon-pink text-white font-bold py-4 px-6 rounded-lg transition-all border border-neon-pink font-mono uppercase tracking-wider"
                  >
                    &gt; CONNECT {connector.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-cyber-darker border-2 border-neon-green rounded-lg p-4">
                  <p className="text-neon-green font-semibold mb-2 font-mono">
                    ✓ WALLET_CONNECTED
                  </p>
                  <p className="text-sm text-gray-400 mb-3 font-mono break-all">
                    ADDRESS: {address}
                  </p>
                  <button
                    onClick={() => disconnect()}
                    className="text-sm text-neon-pink hover:text-neon-purple font-medium font-mono border border-neon-pink px-4 py-2 rounded hover:shadow-neon-pink transition-all"
                  >
                    &gt; DISCONNECT
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2 font-mono">
                    YOUR_NAME:
                  </label>
                  <input
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="np. Ciocia Ewa"
                    className="w-full px-4 py-3 bg-cyber-darker border-2 border-cyber-border text-white rounded-lg focus:border-neon-green focus:shadow-neon-green transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neon-cyan mb-2 font-mono">
                    AMOUNT_ETH:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.1"
                    className="w-full px-4 py-3 bg-cyber-darker border-2 border-cyber-border text-white rounded-lg focus:border-neon-green focus:shadow-neon-green transition-all font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    // ≈ {(parseFloat(depositAmount || '0') * 10000).toFixed(2)} PLN
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple hover:shadow-neon-green text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-neon-green font-mono uppercase tracking-wider animate-glow"
                >
                  {isPending ? '⏳ SIGNING_TX...' :
                   isConfirming ? '⏳ MINING...' :
                   `⚡ SEND ${depositAmount} ETH`}
                </button>

                {hash && (
                  <div className="bg-cyber-darker border-2 border-neon-yellow rounded-lg p-4 animate-pulse">
                    <p className="text-sm text-gray-300 font-mono">
                      ⏳ TX_HASH: <code className="text-neon-yellow text-xs break-all">{hash.slice(0, 10)}...{hash.slice(-8)}</code>
                    </p>
                  </div>
                )}

                {isSuccess && (
                  <div className="bg-cyber-darker border-2 border-neon-green rounded-lg p-4 shadow-neon-green">
                    <p className="text-neon-green font-semibold mb-2 font-mono">
                      ✓ DEPOSIT_SUCCESS
                    </p>
                    <p className="text-sm text-gray-400 font-mono">
                      Thanks for supporting {childName ? String(childName) : 'child'}!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Historia wpłat */}
        <div className="bg-cyber-card border-2 border-neon-yellow rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-neon-yellow font-mono">
            &gt; TRANSACTION_HISTORY
          </h2>

          {contributionsCount && Number(contributionsCount) > 0 ? (
            <div className="space-y-4">
              {Array.from({ length: Number(contributionsCount) }, (_, i) => (
                <ContributionItem key={i} treasuryAddress={treasuryAddress} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-cyber-border rounded-lg">
              <p className="font-mono">// NO_DEPOSITS_YET • BE_FIRST!</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan rounded-lg shadow-neon-pink p-8 text-white text-center border-2 border-neon-pink relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-darker opacity-80"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 font-mono">
              ⚡ SUPPORT {childName ? String(childName).toUpperCase() : 'CHILD'}!
            </h3>
            <p className="mb-6 text-gray-200 font-mono text-sm">
              SEND_ETH • SCAN_QR • USE_DEPOSIT_BUTTON
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={copyAddress}
                className="bg-cyber-darker text-neon-cyan hover:bg-cyber-card font-bold py-3 px-8 rounded-lg transition-all border-2 border-neon-cyan hover:shadow-neon-cyan font-mono"
              >
                &gt; COPY_ADDRESS
              </button>
              <a
                href="/"
                className="bg-cyber-darker text-neon-pink hover:bg-cyber-card font-bold py-3 px-8 rounded-lg transition-all border-2 border-neon-pink hover:shadow-neon-pink font-mono"
              >
                &gt; HOME
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function TreasuryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-bg relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-darker to-cyber-dark opacity-50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255, 0, 110, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 animate-pulse">⚡</div>
          <p className="text-xl text-neon-cyan font-mono animate-flicker">LOADING_VAULT...</p>
        </div>
      </div>
    }>
      <TreasuryPageContent />
    </Suspense>
  );
}

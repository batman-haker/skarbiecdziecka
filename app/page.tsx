'use client';

/**
 * Główna strona - Tworzenie Skarbca
 *
 * Scenariusz: Heniek tworzy skarbiec dla syna Olafa
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, formatEther, decodeEventLog } from 'viem';
import { CONTRACTS } from '@/lib/contracts/addresses';
import TreasuryFactoryABI from '@/lib/contracts/TreasuryFactory.json';

export default function HomePage() {
  // Stan formularza
  const [parentName, setParentName] = useState('Heniek');
  const [childName, setChildName] = useState('Olaf');
  const [childAge, setChildAge] = useState('5');
  const [createdTreasuryAddress, setCreatedTreasuryAddress] = useState<string | null>(null);

  const router = useRouter();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  // Oblicz birth date (timestamp)
  const birthDate = Math.floor(Date.now() / 1000) - parseInt(childAge) * 365 * 24 * 60 * 60;

  // Handler: Utwórz skarbiec
  const handleCreateTreasury = async () => {
    if (!childName || !childAge) {
      alert('Wypełnij wszystkie pola!');
      return;
    }

    try {
      writeContract({
        address: CONTRACTS.TreasuryFactory as `0x${string}`,
        abi: TreasuryFactoryABI,
        functionName: 'createTreasury',
        args: [childName, BigInt(birthDate)],
      });
    } catch (error) {
      console.error('Błąd tworzenia skarbca:', error);
      alert('Wystąpił błąd! Zobacz console.');
    }
  };

  // Gdy transakcja się powiedzie, przekieruj do strony skarbca
  useEffect(() => {
    if (isSuccess && receipt) {
      // Znajdź event TreasuryCreated w logach transakcji
      const treasuryCreatedLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi: TreasuryFactoryABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'TreasuryCreated';
        } catch {
          return false;
        }
      });

      if (treasuryCreatedLog) {
        const decoded = decodeEventLog({
          abi: TreasuryFactoryABI,
          data: treasuryCreatedLog.data,
          topics: treasuryCreatedLog.topics,
        });

        // @ts-ignore - args zawiera [treasuryAddress, owner, childName, birthDate]
        const treasuryAddress = decoded.args[0];

        // Przekieruj do strony skarbca po 2 sekundach
        setTimeout(() => {
          router.push(`/treasury?address=${treasuryAddress}`);
        }, 2000);
      }
    }
  }, [isSuccess, receipt, router]);

  return (
    <div className="min-h-screen bg-cyber-bg relative overflow-hidden">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-darker to-cyber-dark opacity-50"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255, 0, 110, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 animate-flicker">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan">
                ⚡ SKARBIEC DZIECKA
              </span>
            </h1>
            <p className="text-xl text-neon-cyan font-mono tracking-wider">
              &gt; ZBUDUJ PRZYSZŁOŚĆ NA BLOCKCHAIN_
            </p>
            <div className="mt-4 inline-block px-4 py-1 border border-neon-pink rounded text-neon-pink text-sm animate-pulse">
              POWERED BY BASE L2 • 500X TANIEJ
            </div>
          </div>

        {/* Wallet Connection */}
        <div className="bg-cyber-card border-2 border-neon-cyan rounded-lg shadow-neon-cyan p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-neon-cyan to-neon-purple"></div>

          <h2 className="text-2xl font-bold mb-6 text-neon-cyan font-mono">
            [01] &gt; POŁĄCZ_PORTFEL
          </h2>

          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-gray-400 mb-4 font-mono">
                // Inicjalizuj połączenie Web3...
              </p>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="w-full bg-gradient-to-r from-neon-pink to-neon-purple hover:shadow-neon-pink text-white font-bold py-4 px-6 rounded-lg transition-all border border-neon-pink hover:border-neon-purple font-mono uppercase tracking-wider"
                >
                  &gt; CONNECT {connector.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-cyber-darker border-2 border-neon-green rounded-lg p-4 shadow-neon-green">
              <p className="text-neon-green font-semibold mb-2 font-mono">
                ✓ CONNECTION_ESTABLISHED
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
          )}
        </div>

        {/* Create Treasury Form */}
        {isConnected && (
          <div className="bg-cyber-card border-2 border-neon-purple rounded-lg shadow-neon-purple p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink"></div>

            <h2 className="text-2xl font-bold mb-6 text-neon-purple font-mono">
              [02] &gt; UTWÓRZ_SKARBIEC
            </h2>

            <div className="space-y-6">
              {/* Parent Name */}
              <div>
                <label className="block text-sm font-medium text-neon-cyan mb-2 font-mono">
                  PARENT.NAME:
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="np. Heniek"
                  className="w-full px-4 py-3 bg-cyber-darker border-2 border-cyber-border text-white rounded-lg focus:border-neon-cyan focus:shadow-neon-cyan transition-all font-mono"
                />
              </div>

              {/* Child Name */}
              <div>
                <label className="block text-sm font-medium text-neon-cyan mb-2 font-mono">
                  CHILD.NAME:
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="np. Olaf"
                  className="w-full px-4 py-3 bg-cyber-darker border-2 border-cyber-border text-white rounded-lg focus:border-neon-cyan focus:shadow-neon-cyan transition-all font-mono"
                />
              </div>

              {/* Child Age */}
              <div>
                <label className="block text-sm font-medium text-neon-cyan mb-2 font-mono">
                  CHILD.AGE:
                </label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="np. 5"
                  min="0"
                  max="18"
                  className="w-full px-4 py-3 bg-cyber-darker border-2 border-cyber-border text-white rounded-lg focus:border-neon-cyan focus:shadow-neon-cyan transition-all font-mono"
                />
              </div>

              {/* Preview */}
              <div className="bg-cyber-darker border-2 border-neon-yellow rounded-lg p-4">
                <p className="text-sm text-gray-300 font-mono">
                  <span className="text-neon-yellow">{parentName}</span> utworzy skarbiec dla{' '}
                  <span className="text-neon-cyan">{childName}</span> ({childAge} lat)
                </p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateTreasury}
                disabled={isPending || isConfirming}
                className="w-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan hover:shadow-neon-pink text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-neon-pink font-mono uppercase tracking-wider animate-glow"
              >
                {isPending ? '⏳ SIGNING_TX...' :
                 isConfirming ? '⏳ MINING_BLOCK...' :
                 '⚡ DEPLOY_VAULT > ' + childName}
              </button>

              {/* Transaction Status */}
              {hash && (
                <div className="bg-cyber-darker border-2 border-neon-yellow rounded-lg p-4 animate-pulse">
                  <p className="text-sm text-gray-300 font-mono">
                    ⏳ TX_HASH: <code className="text-neon-yellow text-xs break-all">{hash}</code>
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="bg-cyber-darker border-2 border-neon-green rounded-lg p-4 shadow-neon-green">
                  <p className="text-neon-green font-semibold mb-2 font-mono">
                    ✓ VAULT_DEPLOYED_SUCCESS
                  </p>
                  <p className="text-sm text-gray-400 font-mono">
                    Skarbiec dla {childName} zapisany na blockchain
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-cyber-card border-2 border-cyber-border rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold mb-4 text-neon-cyan font-mono">
            [INFO] &gt; JAK_TO_DZIAŁA?
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start font-mono">
              <span className="mr-3 text-neon-pink">[01]</span>
              <span>Połącz portfel Web3 (MetaMask/Coinbase)</span>
            </li>
            <li className="flex items-start font-mono">
              <span className="mr-3 text-neon-purple">[02]</span>
              <span>Deploy smart contract dla dziecka</span>
            </li>
            <li className="flex items-start font-mono">
              <span className="mr-3 text-neon-cyan">[03]</span>
              <span>Rodzina wpłaca na adres kontraktu</span>
            </li>
            <li className="flex items-start font-mono">
              <span className="mr-3 text-neon-yellow">[04]</span>
              <span>Access control: tylko parent może wypłacić</span>
            </li>
          </ul>
        </div>

        {/* Demo Skarbiec */}
        <div className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan rounded-lg shadow-neon-pink p-8 text-white text-center border-2 border-neon-pink relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-darker opacity-80"></div>
          <div className="relative z-10">
            <div className="text-5xl mb-4 animate-pulse">⚡</div>
            <h3 className="text-2xl font-bold mb-3 font-mono">
              &gt; DEMO_VAULT_LIVE
            </h3>
            <p className="mb-6 text-gray-200 font-mono text-sm">
              Heniek deployed vault dla Olafa (5 lat)<br/>
              Balance: 1.0 ETH • Contributors: Babcia + Wujek
            </p>
            <a
              href="/treasury"
              className="inline-block bg-cyber-darker text-neon-cyan hover:bg-cyber-card font-bold py-4 px-8 rounded-lg transition-all text-lg border-2 border-neon-cyan hover:shadow-neon-cyan font-mono uppercase tracking-wider"
            >
              &gt; VIEW_VAULT [OLAF]
            </a>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

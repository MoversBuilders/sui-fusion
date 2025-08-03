import { useState, useEffect } from 'react';
import { ArrowUpDown, Zap, Shield, Globe } from 'lucide-react';
import WalletButton from '@/react-app/components/WalletButton';
import TokenSelector from '@/react-app/components/TokenSelector';
import BlockchainSelector from '@/react-app/components/BlockchainSelector';
import SwapDetails from '@/react-app/components/SwapDetails';
import { useWallet } from '@/react-app/hooks/useWallet';
import { useSwap } from '@/react-app/hooks/useSwap';
import { blockchains, suiTokens, fusionTokens, ethereumTokens } from '@/react-app/data/mockData';
import type { Token, Blockchain } from '@/shared/types';

export default function Home() {
  const {
    suiConnection,
    metamaskConnection,
    connectSui,
    connectMetamask,
    disconnectSui,
    disconnectMetamask,
  } = useWallet();

  const { quote, isLoadingQuote, getSwapQuote } = useSwap();

  const [fromBlockchain, setFromBlockchain] = useState<Blockchain | null>(blockchains[0]); // Sui
  const [toBlockchain, setToBlockchain] = useState<Blockchain | null>(blockchains[2]); // Fusion+
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');

  // Get tokens based on selected blockchain
  const getTokensForBlockchain = (blockchain: Blockchain | null): Token[] => {
    if (!blockchain) return [];
    switch (blockchain.id) {
      case 'sui':
        return suiTokens;
      case 'fusion':
        return fusionTokens;
      case 'ethereum':
        return ethereumTokens;
      default:
        return [];
    }
  };

  const fromTokens = getTokensForBlockchain(fromBlockchain);
  const toTokens = getTokensForBlockchain(toBlockchain);

  // Auto-select first token when blockchain changes
  useEffect(() => {
    const tokens = getTokensForBlockchain(fromBlockchain);
    if (tokens.length > 0 && !fromToken) {
      setFromToken(tokens[0]);
    }
  }, [fromBlockchain, fromToken]);

  useEffect(() => {
    const tokens = getTokensForBlockchain(toBlockchain);
    if (tokens.length > 0 && !toToken) {
      setToToken(tokens[0]);
    }
  }, [toBlockchain, toToken]);

  // Get quote when inputs change
  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      getSwapQuote(fromToken, toToken, fromAmount);
    }
  }, [fromToken, toToken, fromAmount, getSwapQuote]);

  const handleSwapDirection = () => {
    setFromBlockchain(toBlockchain);
    setToBlockchain(fromBlockchain);
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  };

  const isSwapReady = fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0;
  const needsWalletConnection = (fromBlockchain?.id === 'sui' && !suiConnection?.isConnected) || 
                               ((fromBlockchain?.id === 'ethereum' || fromBlockchain?.id === 'fusion') && !metamaskConnection?.isConnected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Sui ⟷ Fusion+
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <WalletButton
                walletType="sui"
                connection={suiConnection}
                onConnect={connectSui}
                onDisconnect={disconnectSui}
              />
              <WalletButton
                walletType="metamask"
                connection={metamaskConnection}
                onConnect={connectMetamask}
                onDisconnect={disconnectMetamask}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Cross-Chain Swaps Made Simple
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Seamlessly swap tokens between Sui and Fusion+ networks
          </p>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Cross-Chain</span>
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
          {/* From Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BlockchainSelector
                selectedBlockchain={fromBlockchain}
                blockchains={blockchains}
                onBlockchainSelect={setFromBlockchain}
                label="From Network"
              />
              <TokenSelector
                selectedToken={fromToken}
                tokens={fromTokens}
                onTokenSelect={setFromToken}
                label="Token"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-lg font-medium"
                />
                {fromToken?.balance && (
                  <button
                    onClick={() => setFromAmount(fromToken.balance?.replace(/,/g, '') || '')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    MAX
                  </button>
                )}
              </div>
              {fromToken?.balance && (
                <div className="text-sm text-gray-500 mt-1">
                  Balance: {fromToken.balance} {fromToken.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center my-6">
            <button
              onClick={handleSwapDirection}
              className="p-3 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200 border-4 border-white shadow-lg"
            >
              <ArrowUpDown className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          {/* To Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BlockchainSelector
                selectedBlockchain={toBlockchain}
                blockchains={blockchains}
                onBlockchainSelect={setToBlockchain}
                label="To Network"
              />
              <TokenSelector
                selectedToken={toToken}
                tokens={toTokens}
                onTokenSelect={setToToken}
                label="Token"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                You'll receive
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-medium text-gray-900">
                {quote?.toAmount || '0.0'}
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="mt-6">
            <SwapDetails quote={quote} isLoading={isLoadingQuote} />
          </div>

          {/* Swap Button */}
          <div className="mt-6">
            {needsWalletConnection ? (
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  Please connect your wallet to continue
                </p>
              </div>
            ) : (
              <button
                disabled={!isSwapReady}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  isSwapReady
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSwapReady ? 'Swap Tokens' : 'Enter Amount'}
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Secure</h3>
                <p className="text-sm text-gray-600">Non-custodial swaps</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Fast</h3>
                <p className="text-sm text-gray-600">2-8 minute swaps</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Cross-Chain</h3>
                <p className="text-sm text-gray-600">Multiple networks</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

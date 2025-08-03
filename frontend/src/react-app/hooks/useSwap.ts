import { useState, useCallback } from 'react';
import type { SwapQuote, Token } from '@/shared/types';

export function useSwap() {
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const getSwapQuote = useCallback(async (
    fromToken: Token | null,
    toToken: Token | null, 
    fromAmount: string
  ) => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null);
      return;
    }

    setIsLoadingQuote(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Mock quote calculation
      const rate = 0.95 + Math.random() * 0.1; // Random rate between 0.95-1.05
      const toAmount = (parseFloat(fromAmount) * rate).toFixed(6);
      
      const mockQuote: SwapQuote = {
        fromToken,
        toToken: {
          address: toToken.address,
          symbol: toToken.symbol,
          name: toToken.name,
          decimals: toToken.decimals,
          icon: toToken.icon,
        },
        fromAmount,
        toAmount,
        exchangeRate: rate.toFixed(6),
        priceImpact: (Math.random() * 0.3).toFixed(3),
        networkFee: '$0.00',
        bridgeFee: `${(parseFloat(fromAmount) * 0.001).toFixed(4)} ${fromToken.symbol}`,
        estimatedTime: `${Math.floor(Math.random() * 3) + 3}-${Math.floor(Math.random() * 2) + 6} min`,
      };

      setQuote(mockQuote);
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      setQuote(null);
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  return {
    quote,
    isLoadingQuote,
    getSwapQuote,
  };
}

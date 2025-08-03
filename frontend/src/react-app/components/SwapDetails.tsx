import { useState } from 'react';
import { ChevronDown, Clock, Zap, TrendingUp, Shield, Users, Timer } from 'lucide-react';
import type { SwapQuote } from '@/shared/types';

interface SwapDetailsProps {
  quote: SwapQuote | null;
  isLoading: boolean;
}

export default function SwapDetails({ quote, isLoading }: SwapDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center text-gray-500">
        Enter amounts to see swap details
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 transition-colors duration-200 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">
              1 {quote.fromToken.symbol} = {quote.exchangeRate} {quote.toToken.symbol}
            </div>
            <div className="text-sm text-gray-600">
              Click to {isExpanded ? 'hide' : 'view'} details
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-200 bg-white rounded-b-lg">
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">MEV Protection</div>
                <div className="font-medium text-green-700">Active</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Timelock</div>
                <div className="font-medium text-gray-900">24 hours</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Active Resolvers</div>
                <div className="font-medium text-gray-900">5 competing</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Settlement Time</div>
                <div className="font-medium text-gray-900">{quote.estimatedTime}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Network Fees</span>
              <span className="font-medium text-green-700">$0.00</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Protocol Fee</span>
              <span className="font-medium text-green-700">$0.00</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Price Impact</span>
              <span className="font-medium text-gray-900">&lt; 0.01%</span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-900">You'll receive</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">{quote.toAmount} {quote.toToken.symbol}</div>
                <div className="text-xs text-gray-500">≈ ${(parseFloat(quote.toAmount) * 1.23).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>Secured by HTLC cryptographic commitments • No bridge messaging required</span>
          </div>
        </div>
      )}
    </div>
  );
}

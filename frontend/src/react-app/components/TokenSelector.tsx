import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Token } from '@/shared/types';

interface TokenSelectorProps {
  selectedToken: Token | null;
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  label: string;
}

export default function TokenSelector({ 
  selectedToken, 
  tokens, 
  onTokenSelect, 
  label 
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {selectedToken ? (
            <>
              <img 
                src={selectedToken.icon} 
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/24/3B82F6/FFFFFF?text=${selectedToken.symbol[0]}`;
                }}
              />
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedToken.symbol}</div>
                <div className="text-xs text-gray-500">{selectedToken.name}</div>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Select a token</div>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={`${token.address}-${token.symbol}`}
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-left"
              >
                <img 
                  src={token.icon} 
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/3B82F6/FFFFFF?text=${token.symbol[0]}`;
                  }}
                />
                <div>
                  <div className="font-medium text-gray-900">{token.symbol}</div>
                  <div className="text-sm text-gray-500">{token.name}</div>
                  {token.balance && (
                    <div className="text-xs text-gray-400">Balance: {token.balance}</div>
                  )}
                </div>
              </button>
            ))}
            
            {filteredTokens.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No tokens found
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
        />
      )}
    </div>
  );
}

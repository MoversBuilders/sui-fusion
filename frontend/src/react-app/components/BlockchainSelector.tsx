import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Blockchain } from '@/shared/types';

interface BlockchainSelectorProps {
  selectedBlockchain: Blockchain | null;
  blockchains: Blockchain[];
  onBlockchainSelect: (blockchain: Blockchain) => void;
  label: string;
}

export default function BlockchainSelector({ 
  selectedBlockchain, 
  blockchains, 
  onBlockchainSelect, 
  label 
}: BlockchainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          {selectedBlockchain ? (
            <>
              <img 
                src={selectedBlockchain.icon} 
                alt={selectedBlockchain.name}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/24/3B82F6/FFFFFF?text=${selectedBlockchain.symbol[0]}`;
                }}
              />
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedBlockchain.name}</div>
                <div className="text-xs text-gray-500">{selectedBlockchain.symbol}</div>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Select blockchain</div>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {blockchains.map((blockchain) => (
            <button
              key={blockchain.id}
              onClick={() => {
                onBlockchainSelect(blockchain);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-left first:rounded-t-lg last:rounded-b-lg"
            >
              <img 
                src={blockchain.icon} 
                alt={blockchain.name}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/3B82F6/FFFFFF?text=${blockchain.symbol[0]}`;
                }}
              />
              <div>
                <div className="font-medium text-gray-900">{blockchain.name}</div>
                <div className="text-sm text-gray-500">{blockchain.symbol}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

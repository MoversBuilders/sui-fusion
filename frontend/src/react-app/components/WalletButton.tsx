import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import type { WalletConnection } from '@/shared/types';

interface WalletButtonProps {
  walletType: 'sui' | 'metamask';
  connection: WalletConnection | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletButton({ walletType, connection, onConnect, onDisconnect }: WalletButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const walletName = walletType === 'sui' ? 'Sui Wallet' : 'MetaMask';
  const walletIcon = walletType === 'sui' ? '🔵' : '🦊';

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!connection?.isConnected) {
    return (
      <button
        onClick={onConnect}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
      >
        <span className="text-lg">{walletIcon}</span>
        <Wallet className="w-4 h-4" />
        <span>Connect {walletName}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg transition-colors duration-200 font-medium border border-blue-300"
      >
        <span className="text-lg">{walletIcon}</span>
        <span>{formatAddress(connection.address)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="text-sm text-gray-500">{walletName}</div>
            <div className="text-sm font-mono">{formatAddress(connection.address)}</div>
          </div>
          <button
            onClick={() => {
              onDisconnect();
              setIsDropdownOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            Disconnect
          </button>
        </div>
      )}

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

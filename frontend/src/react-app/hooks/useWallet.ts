import { useState, useCallback } from 'react';
import type { WalletConnection } from '@/shared/types';

export function useWallet() {
  const [suiConnection, setSuiConnection] = useState<WalletConnection | null>(null);
  const [metamaskConnection, setMetamaskConnection] = useState<WalletConnection | null>(null);

  const connectSui = useCallback(async () => {
    try {
      // Mock Sui wallet connection
      // In a real app, this would integrate with the Sui wallet SDK
      const mockConnection: WalletConnection = {
        address: '0x' + Math.random().toString(16).slice(2, 42),
        chainId: 'sui:mainnet',
        isConnected: true,
      };
      setSuiConnection(mockConnection);
    } catch (error) {
      console.error('Failed to connect Sui wallet:', error);
    }
  }, []);

  const connectMetamask = useCallback(async () => {
    try {
      // Mock MetaMask connection
      // In a real app, this would use window.ethereum
      const mockConnection: WalletConnection = {
        address: '0x' + Math.random().toString(16).slice(2, 42),
        chainId: '0x1', // Ethereum mainnet
        isConnected: true,
      };
      setMetamaskConnection(mockConnection);
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
    }
  }, []);

  const disconnectSui = useCallback(() => {
    setSuiConnection(null);
  }, []);

  const disconnectMetamask = useCallback(() => {
    setMetamaskConnection(null);
  }, []);

  return {
    suiConnection,
    metamaskConnection,
    connectSui,
    connectMetamask,
    disconnectSui,
    disconnectMetamask,
  };
}

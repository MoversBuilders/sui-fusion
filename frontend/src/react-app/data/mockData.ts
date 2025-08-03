import type { Blockchain, Token } from '@/shared/types';

export const blockchains: Blockchain[] = [
  {
    id: 'sui',
    name: 'Sui Network',
    symbol: 'SUI',
    icon: 'https://cryptologos.cc/logos/sui-sui-logo.png',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    chainId: 'sui:mainnet',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    chainId: '0x1',
  },
  {
    id: 'fusion',
    name: 'Fusion+',
    symbol: 'FSN+',
    icon: 'https://via.placeholder.com/32/6366F1/FFFFFF?text=F+',
    rpcUrl: 'https://mainnet.fusionnetwork.io',
    chainId: 'fusion:mainnet',
  },
];

export const suiTokens: Token[] = [
  {
    address: '0x2::sui::SUI',
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    icon: 'https://cryptologos.cc/logos/sui-sui-logo.png',
    balance: '1,234.567',
  },
  {
    address: '0x2::coin::COIN<0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN>',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    balance: '5,678.90',
  },
  {
    address: '0x2::coin::COIN<0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN>',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 8,
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    balance: '12.345',
  },
];

export const fusionTokens: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'FSN+',
    name: 'Fusion+',
    decimals: 18,
    icon: 'https://via.placeholder.com/32/6366F1/FFFFFF?text=F+',
    balance: '987.654',
  },
  {
    address: '0xa0b86a33e6776c7301b4b2c28b6b6e8a9e0e0e0e',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    balance: '3,456.78',
  },
  {
    address: '0xb1c86a33e6776c7301b4b2c28b6b6e8a9e0e0e0e',
    symbol: 'BTC+',
    name: 'Bitcoin+',
    decimals: 8,
    icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    balance: '0.987654',
  },
];

export const ethereumTokens: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    balance: '45.678',
  },
  {
    address: '0xa0b86a33e6776c7301b4b2c28b6b6e8a9e0e0e0e',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    balance: '12,345.67',
  },
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    balance: '8,901.23',
  },
];

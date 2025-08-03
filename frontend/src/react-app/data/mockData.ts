import type { Blockchain, Token } from '@/shared/types';

export const blockchains: Blockchain[] = [
  {
    id: 'sui',
    name: 'Sui Network',
    symbol: 'SUI',
    icon: 'https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    chainId: 'sui:mainnet',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    chainId: '0x1',
  },
];

export const suiTokens: Token[] = [
  {
    address: '0x2::sui::SUI',
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    icon: 'https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png',
    balance: '1,234.567',
  },
  {
    address: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    balance: '5,678.90',
  },
  {
    address: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 8,
    icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    balance: '12.345',
  },
  {
    address: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::coin::COIN',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    balance: '2,890.12',
  },
];



export const ethereumTokens: Token[] = [
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    balance: '45.678',
  },
  {
    address: '0xa0b86a33e6776c7301b4b2c28b6b6e8a9e0e0e0e',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    balance: '12,345.67',
  },
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    balance: '8,901.23',
  },
  {
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    icon: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
    balance: '1.234567',
  },
  {
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    icon: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png',
    balance: '456.789',
  },
];

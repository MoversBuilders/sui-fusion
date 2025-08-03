import z from "zod";

export const BlockchainSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  icon: z.string(),
  rpcUrl: z.string(),
  chainId: z.string(),
});

export const TokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  icon: z.string(),
  balance: z.string().optional(),
});

export const SwapQuoteSchema = z.object({
  fromToken: TokenSchema,
  toToken: z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    icon: z.string(),
  }),
  fromAmount: z.string(),
  toAmount: z.string(),
  exchangeRate: z.string(),
  priceImpact: z.string(),
  networkFee: z.string(),
  bridgeFee: z.string(),
  estimatedTime: z.string(),
});

export type Blockchain = z.infer<typeof BlockchainSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type SwapQuote = z.infer<typeof SwapQuoteSchema>;

export interface WalletConnection {
  address: string;
  chainId: string;
  isConnected: boolean;
}

export interface Order {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface FillOrderParams {
  orderBookId: string;
  order: Order;
  signature: string;
  takerCoinId: string;
  makerCoinId: string;
  amount: string;
  takerTraits: string;
  clockId: string;
}

export interface CreateOrderParams {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface CancelOrderParams {
  orderBookId: string;
  orderHash: string;
} 
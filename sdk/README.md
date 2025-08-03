# Sui Fusion SDK - Limit Order

TypeScript SDK for interacting with the limit_order Move contract on Sui blockchain.

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

This will compile the TypeScript code and generate JavaScript files in the `dist/` directory.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Usage

### Basic Setup

```typescript
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { LimitOrderSDK } from './src/limit_order';

// Initialize the SDK
const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const sdk = new LimitOrderSDK(client, '0x...'); // Your deployed package ID

// Generate keypairs
const maker = Ed25519Keypair.generate();
const taker = Ed25519Keypair.generate();
```

### Creating Orders

```typescript
import { CreateOrderParams } from './src/types';

const orderParams: CreateOrderParams = {
  salt: '12345',
  maker: maker.getPublicKey().toSuiAddress(),
  receiver: maker.getPublicKey().toSuiAddress(),
  makerAsset: '0x2::sui::SUI', // SUI coin type
  takerAsset: '0x...::test_token::TEST_TOKEN', // Test token
  makingAmount: '1000000000', // 1 SUI (9 decimals)
  takingAmount: '500000000',   // 500 test tokens
  makerTraits: '0',
};

const result = await sdk.createOrder(maker, orderParams);
console.log('Order created:', result.effects?.status?.status);
```

### Using Simple Order Creation

```typescript
// Create a simple order with default parameters
const simpleOrder = sdk.createSimpleOrder(
  maker.getPublicKey().toSuiAddress(),
  '0x2::sui::SUI',
  '0x...::test_token::TEST_TOKEN',
  '1000000000', // 1 SUI
  '500000000'   // 500 test tokens
);

// Validate the order before submission
if (sdk.validateOrder(simpleOrder)) {
  const result = await sdk.createOrder(maker, simpleOrder);
  console.log('Order created successfully');
}
```

### Filling Orders

```typescript
import { FillOrderParams } from './src/types';

const fillParams: FillOrderParams = {
  orderBookId: '0x...', // Order book object ID
  order: {
    salt: '12345',
    maker: maker.getPublicKey().toSuiAddress(),
    receiver: maker.getPublicKey().toSuiAddress(),
    makerAsset: '0x2::sui::SUI',
    takerAsset: '0x...::test_token::TEST_TOKEN',
    makingAmount: '1000000000',
    takingAmount: '500000000',
    makerTraits: '0',
  },
  signature: '0x...', // Order signature
  takerCoinId: '0x...', // Taker's coin object ID
  makerCoinId: '0x...', // Maker's coin object ID
  amount: '500000000',
  takerTraits: '0',
  clockId: '0x6', // Sui clock object ID
};

const result = await sdk.fillOrder(taker, fillParams);
console.log('Order filled:', result.effects?.status?.status);
```

### Cancelling Orders

```typescript
import { CancelOrderParams } from './src/types';

const cancelParams: CancelOrderParams = {
  orderBookId: '0x...', // Order book object ID
  orderHash: '0x...',   // Order hash to cancel
};

const result = await sdk.cancelOrder(maker, cancelParams);
console.log('Order cancelled:', result.effects?.status?.status);
```

### Checking Order Status

```typescript
// Check if an order is filled
const isFilled = await sdk.isOrderFilled(orderBookId, orderHash);
console.log('Order is filled:', isFilled);

// Get order book information
const orderBook = await sdk.getOrderBook(orderBookId);
console.log('Order book:', orderBook);

// Get all filled orders (placeholder implementation)
const filledOrders = await sdk.getFilledOrders(orderBookId);
console.log('Filled orders:', filledOrders);
```

### Hashing Orders

```typescript
import { Order } from './src/types';

const order: Order = {
  salt: '12345',
  maker: maker.getPublicKey().toSuiAddress(),
  receiver: maker.getPublicKey().toSuiAddress(),
  makerAsset: '0x2::sui::SUI',
  takerAsset: '0x...::test_token::TEST_TOKEN',
  makingAmount: '1000000000',
  takingAmount: '500000000',
  makerTraits: '0',
};

const orderHash = await sdk.hashOrder(order);
console.log('Order hash:', orderHash);
```

## API Reference

### LimitOrderSDK

#### Constructor
```typescript
new LimitOrderSDK(client: SuiClient, packageId: string, module?: string)
```

#### Methods

##### `createOrder(signer: Ed25519Keypair, params: CreateOrderParams)`
Creates a new limit order on the blockchain.

##### `fillOrder(signer: Ed25519Keypair, params: FillOrderParams)`
Fills an existing limit order.

##### `cancelOrder(signer: Ed25519Keypair, params: CancelOrderParams)`
Cancels an existing limit order.

##### `isOrderFilled(orderBookId: string, orderHash: string): Promise<boolean>`
Checks if an order is filled.

##### `hashOrder(order: Order): Promise<string>`
Hashes an order to get its unique identifier.

##### `getOrderBook(orderBookId: string)`
Gets order book information.

##### `getFilledOrders(orderBookId: string): Promise<string[]>`
Gets all filled orders from an order book.

##### `validateOrder(order: Order): boolean`
Validates an order before submission.

##### `createSimpleOrder(maker: string, makerAsset: string, takerAsset: string, makingAmount: string, takingAmount: string): CreateOrderParams`
Creates a simple order with default parameters.

##### `getPackageId(): string`
Gets the package ID.

##### `getModule(): string`
Gets the module name.

## Types

### Order
```typescript
interface Order {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}
```

### CreateOrderParams
```typescript
interface CreateOrderParams {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}
```

### FillOrderParams
```typescript
interface FillOrderParams {
  orderBookId: string;
  order: Order;
  signature: string;
  takerCoinId: string;
  makerCoinId: string;
  amount: string;
  takerTraits: string;
  clockId: string;
}
```

### CancelOrderParams
```typescript
constructor(client: SuiClient, packageId: string, module?: string)
```

#### Methods

- `createOrder(signer: Ed25519Keypair, params: CreateOrderParams)`
- `fillOrder(signer: Ed25519Keypair, params: FillOrderParams)`
- `cancelOrder(signer: Ed25519Keypair, params: CancelOrderParams)`
- `isOrderFilled(orderBookId: string, orderHash: string): Promise<boolean>`
- `hashOrder(order: Order): Promise<string>`
- `getPackageId(): string`
- `getModule(): string`

### Interfaces

- `Order` - Order structure
- `CreateOrderParams` - Parameters for creating orders
- `FillOrderParams` - Parameters for filling orders
- `CancelOrderParams` - Parameters for cancelling orders

## License
[BSD-3-Clause](../LICENSE)
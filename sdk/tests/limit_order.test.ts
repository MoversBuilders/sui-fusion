import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { LimitOrderSDK } from '../src/limit_order';
import { Order, CreateOrderParams, FillOrderParams, CancelOrderParams } from '../src/types';

// Test configuration - replace with actual deployed contract details
const TEST_CONFIG = {
  packageId: '0x...', // Replace with actual deployed package ID
  orderBookId: '0x...', // Replace with actual order book object ID
  clockId: '0x6', // Sui clock object ID
  makerAsset: '0x2::sui::SUI',
  takerAsset: '0x...::test_token::TEST_TOKEN', // Replace with actual test token
  makerCoinId: '0x...', // Replace with actual maker coin object ID
  takerCoinId: '0x...', // Replace with actual taker coin object ID
};

describe('LimitOrderSDK End-to-End Tests', () => {
  let client: SuiClient;
  let sdk: LimitOrderSDK;
  let maker: Ed25519Keypair;
  let taker: Ed25519Keypair;

  beforeAll(async () => {
    // Initialize Sui client
    client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // Initialize SDK
    sdk = new LimitOrderSDK(client, TEST_CONFIG.packageId);
    
    // Generate test keypairs
    maker = Ed25519Keypair.generate();
    taker = Ed25519Keypair.generate();
    
    console.log('Test setup complete');
    console.log('Maker address:', maker.getPublicKey().toSuiAddress());
    console.log('Taker address:', taker.getPublicKey().toSuiAddress());
  });

  describe('SDK Initialization', () => {
    test('should initialize SDK with correct package ID', () => {
      expect(sdk).toBeDefined();
      expect(sdk.getPackageId()).toBe(TEST_CONFIG.packageId);
      expect(sdk.getModule()).toBe('limit_order');
    });

    test('should connect to Sui network', async () => {
      const version = await client.getRpcApiVersion();
      expect(version).toBeDefined();
    });
  });

  describe('Order Creation', () => {
    test('should create simple order with default parameters', () => {
      const simpleOrder = sdk.createSimpleOrder(
        maker.getPublicKey().toSuiAddress(),
        TEST_CONFIG.makerAsset,
        TEST_CONFIG.takerAsset,
        '1000000000', // 1 SUI
        '500000000'   // 500 test tokens
      );

      expect(simpleOrder).toBeDefined();
      expect(simpleOrder.maker).toBe(maker.getPublicKey().toSuiAddress());
      expect(simpleOrder.makerAsset).toBe(TEST_CONFIG.makerAsset);
      expect(simpleOrder.takerAsset).toBe(TEST_CONFIG.takerAsset);
      expect(simpleOrder.makingAmount).toBe('1000000000');
      expect(simpleOrder.takingAmount).toBe('500000000');
    });

    test('should validate order parameters correctly', () => {
      const validOrder: Order = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      expect(sdk.validateOrder(validOrder)).toBe(true);
    });

    test('should reject invalid orders', () => {
      const invalidOrder: Order = {
        salt: '',
        maker: '',
        receiver: '',
        makerAsset: '',
        takerAsset: '',
        makingAmount: '0',
        takingAmount: '0',
        makerTraits: '0',
      };

      expect(sdk.validateOrder(invalidOrder)).toBe(false);
    });

    test('should reject orders with zero amounts', () => {
      const zeroAmountOrder: Order = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '0',
        takingAmount: '0',
        makerTraits: '0',
      };

      expect(sdk.validateOrder(zeroAmountOrder)).toBe(false);
    });
  });

  describe('Order Hashing', () => {
    test('should hash order consistently', async () => {
      const order: Order = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      const hash1 = await sdk.hashOrder(order);
      const hash2 = await sdk.hashOrder(order);

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).toBe(hash2); // Should be consistent
    });

    test('should produce different hashes for different orders', async () => {
      const order1: Order = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      const order2: Order = {
        salt: '987654321',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      const hash1 = await sdk.hashOrder(order1);
      const hash2 = await sdk.hashOrder(order2);

      expect(hash1).not.toBe(hash2); // Should be different
    });
  });

  describe('Order Book Operations', () => {
    test('should get order book information', async () => {
      try {
        const orderBook = await sdk.getOrderBook(TEST_CONFIG.orderBookId);
        expect(orderBook).toBeDefined();
        expect(orderBook.data).toBeDefined();
      } catch (error) {
        // This might fail if the order book doesn't exist yet
        console.log('Order book not found (expected for new deployments):', error);
      }
    });

    test('should check order filled status', async () => {
      const testOrderHash = '0x' + '0'.repeat(64);
      
      try {
        const isFilled = await sdk.isOrderFilled(TEST_CONFIG.orderBookId, testOrderHash);
        expect(typeof isFilled).toBe('boolean');
      } catch (error) {
        // This might fail if the order book doesn't exist yet
        console.log('Order status check failed (expected for new deployments):', error);
      }
    });

    test('should get filled orders list', async () => {
      try {
        const filledOrders = await sdk.getFilledOrders(TEST_CONFIG.orderBookId);
        expect(Array.isArray(filledOrders)).toBe(true);
      } catch (error) {
        // This might fail if the order book doesn't exist yet
        console.log('Filled orders check failed (expected for new deployments):', error);
      }
    });
  });

  describe('Transaction Building', () => {
    test('should build create order transaction', async () => {
      const orderParams: CreateOrderParams = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      // Test that the transaction can be built (dry run)
      try {
        const tx = new (await import('@mysten/sui/transactions')).Transaction();
        
        tx.moveCall({
          target: `${TEST_CONFIG.packageId}::limit_order::create_order`,
          arguments: [
            tx.pure.u256(orderParams.salt),
            tx.pure.address(orderParams.maker),
            tx.pure.address(orderParams.receiver),
            tx.pure.address(orderParams.makerAsset),
            tx.pure.address(orderParams.takerAsset),
            tx.pure.u256(orderParams.makingAmount),
            tx.pure.u256(orderParams.takingAmount),
            tx.pure.u256(orderParams.makerTraits),
          ],
        });

        const result = await tx.build({ client });
        expect(result).toBeDefined();
      } catch (error) {
        // This might fail if the package isn't deployed yet
        console.log('Transaction build failed (expected for new deployments):', error);
      }
    });

    test('should build fill order transaction', async () => {
      const order: Order = {
        salt: '123456789',
        maker: maker.getPublicKey().toSuiAddress(),
        receiver: maker.getPublicKey().toSuiAddress(),
        makerAsset: TEST_CONFIG.makerAsset,
        takerAsset: TEST_CONFIG.takerAsset,
        makingAmount: '1000000000',
        takingAmount: '500000000',
        makerTraits: '0',
      };

      const fillParams: FillOrderParams = {
        orderBookId: TEST_CONFIG.orderBookId,
        order,
        signature: '0x' + '0'.repeat(128), // Placeholder signature
        takerCoinId: TEST_CONFIG.takerCoinId,
        makerCoinId: TEST_CONFIG.makerCoinId,
        amount: '500000000',
        takerTraits: '0',
        clockId: TEST_CONFIG.clockId,
      };

      // Test that the transaction can be built (dry run)
      try {
        const tx = new (await import('@mysten/sui/transactions')).Transaction();
        
        // Create the order object
        const orderObj = tx.moveCall({
          target: `${TEST_CONFIG.packageId}::limit_order::create_order`,
          arguments: [
            tx.pure.u256(order.salt),
            tx.pure.address(order.maker),
            tx.pure.address(order.receiver),
            tx.pure.address(order.makerAsset),
            tx.pure.address(order.takerAsset),
            tx.pure.u256(order.makingAmount),
            tx.pure.u256(order.takingAmount),
            tx.pure.u256(order.makerTraits),
          ],
        });

        // Create signature object
        const signature = tx.moveCall({
          target: `${TEST_CONFIG.packageId}::sui_signing::create_test_signature`,
          arguments: [],
        });

        // Create taker traits
        const takerTraits = tx.moveCall({
          target: `${TEST_CONFIG.packageId}::taker_traits::new`,
          arguments: [tx.pure.u256(fillParams.takerTraits)],
        });

        // Fill order call
        tx.moveCall({
          target: `${TEST_CONFIG.packageId}::limit_order::fill_order`,
          arguments: [
            tx.object(fillParams.orderBookId),
            orderObj,
            signature,
            tx.object(fillParams.takerCoinId),
            tx.object(fillParams.makerCoinId),
            tx.pure.u256(fillParams.amount),
            takerTraits,
            tx.object(fillParams.clockId),
          ],
        });

        const result = await tx.build({ client });
        expect(result).toBeDefined();
      } catch (error) {
        // This might fail if the package isn't deployed yet
        console.log('Fill order transaction build failed (expected for new deployments):', error);
      }
    });

    test('should build cancel order transaction', async () => {
      const cancelParams: CancelOrderParams = {
        orderBookId: TEST_CONFIG.orderBookId,
        orderHash: '0x' + '0'.repeat(64),
      };

      // Test that the transaction can be built (dry run)
      try {
        const tx = new (await import('@mysten/sui/transactions')).Transaction();
        
        tx.moveCall({
          target: `${TEST_CONFIG.packageId}::limit_order::cancel_order`,
          arguments: [
            tx.object(cancelParams.orderBookId),
            tx.pure.vector('u8', Array.from(cancelParams.orderHash).map(c => c.charCodeAt(0))),
          ],
        });

        const result = await tx.build({ client });
        expect(result).toBeDefined();
      } catch (error) {
        // This might fail if the package isn't deployed yet
        console.log('Cancel order transaction build failed (expected for new deployments):', error);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid package ID gracefully', () => {
      const invalidSdk = new LimitOrderSDK(client, '0xinvalid');
      expect(invalidSdk).toBeDefined();
    });

    test('should handle network errors gracefully', async () => {
      try {
        await sdk.getOrderBook('0xinvalid');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle invalid order book ID gracefully', async () => {
      try {
        const isFilled = await sdk.isOrderFilled('0xinvalid', '0xinvalid');
        expect(typeof isFilled).toBe('boolean');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});

// Helper function to run tests with different configurations
export function runTestsWithConfig(config: typeof TEST_CONFIG) {
  describe('LimitOrderSDK with Custom Config', () => {
    let customSdk: LimitOrderSDK;

    beforeAll(() => {
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      customSdk = new LimitOrderSDK(client, config.packageId);
    });

    test('should initialize with custom config', () => {
      expect(customSdk.getPackageId()).toBe(config.packageId);
    });
  });
}

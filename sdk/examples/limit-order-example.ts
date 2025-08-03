import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { LimitOrderSDK } from '../src/limit_order';
import { Order, CreateOrderParams, FillOrderParams } from '../src/types/index.types';

/**
 * Example usage of the LimitOrderSDK
 * This demonstrates how to create, fill, and manage limit orders
 */
async function main() {
  // Initialize the Sui client
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  
  // Initialize the SDK with your deployed package ID
  const packageId = '0x...'; // Replace with your actual package ID
  const sdk = new LimitOrderSDK(client, packageId);

  // Generate keypairs for testing
  const maker = Ed25519Keypair.generate();
  const taker = Ed25519Keypair.generate();

  console.log('Maker address:', maker.getPublicKey().toSuiAddress());
  console.log('Taker address:', taker.getPublicKey().toSuiAddress());

  // Example 1: Create a simple order
  console.log('\n=== Creating a Simple Order ===');
  
  const simpleOrderParams = sdk.createSimpleOrder(
    maker.getPublicKey().toSuiAddress(),
    '0x2::sui::SUI', // SUI coin type
    '0x...::test_token::TEST_TOKEN', // Some test token
    '1000000000', // 1 SUI (9 decimals)
    '500000000'   // 500 test tokens
  );

  console.log('Simple order params:', simpleOrderParams);

  // Validate the order
  const isValid = sdk.validateOrder(simpleOrderParams);
  console.log('Order is valid:', isValid);

  // Example 2: Create a custom order
  console.log('\n=== Creating a Custom Order ===');
  
  const customOrderParams: CreateOrderParams = {
    salt: '123456789',
    maker: maker.getPublicKey().toSuiAddress(),
    receiver: maker.getPublicKey().toSuiAddress(),
    makerAsset: '0x2::sui::SUI',
    takerAsset: '0x...::test_token::TEST_TOKEN',
    makingAmount: '1000000000',
    takingAmount: '500000000',
    makerTraits: '0',
  };

  console.log('Custom order params:', customOrderParams);

  // Example 3: Create an order (commented out to avoid actual transaction)
  /*
  try {
    console.log('\n=== Creating Order on Chain ===');
    const result = await sdk.createOrder(maker, customOrderParams);
    console.log('Order created successfully:', result.digest);
  } catch (error) {
    console.error('Error creating order:', error);
  }
  */

  // Example 4: Hash an order
  console.log('\n=== Hashing an Order ===');
  
  const orderToHash: Order = {
    salt: '123456789',
    maker: maker.getPublicKey().toSuiAddress(),
    receiver: maker.getPublicKey().toSuiAddress(),
    makerAsset: '0x2::sui::SUI',
    takerAsset: '0x...::test_token::TEST_TOKEN',
    makingAmount: '1000000000',
    takingAmount: '500000000',
    makerTraits: '0',
  };

  try {
    const orderHash = await sdk.hashOrder(orderToHash);
    console.log('Order hash:', orderHash);
  } catch (error) {
    console.error('Error hashing order:', error);
  }

  // Example 5: Check if order is filled
  console.log('\n=== Checking Order Status ===');
  
  const orderBookId = '0x...'; // Replace with actual order book ID
  const orderHash = '0x...'; // Replace with actual order hash
  
  try {
    const isFilled = await sdk.isOrderFilled(orderBookId, orderHash);
    console.log('Order is filled:', isFilled);
  } catch (error) {
    console.error('Error checking order status:', error);
  }

  // Example 6: Get order book information
  console.log('\n=== Getting Order Book Info ===');
  
  try {
    const orderBook = await sdk.getOrderBook(orderBookId);
    console.log('Order book:', orderBook);
  } catch (error) {
    console.error('Error getting order book:', error);
  }

  // Example 7: Fill an order (commented out to avoid actual transaction)
  /*
  console.log('\n=== Filling an Order ===');
  
  const fillParams: FillOrderParams = {
    orderBookId: '0x...', // Replace with actual order book ID
    order: orderToHash,
    signature: '0x...', // Replace with actual signature
    takerCoinId: '0x...', // Replace with actual taker coin ID
    makerCoinId: '0x...', // Replace with actual maker coin ID
    amount: '500000000',
    takerTraits: '0',
    clockId: '0x6', // Sui clock object ID
  };

  try {
    const result = await sdk.fillOrder(taker, fillParams);
    console.log('Order filled successfully:', result.digest);
  } catch (error) {
    console.error('Error filling order:', error);
  }
  */

  // Example 8: Cancel an order (commented out to avoid actual transaction)
  /*
  console.log('\n=== Cancelling an Order ===');
  
  try {
    const result = await sdk.cancelOrder(maker, {
      orderBookId: '0x...', // Replace with actual order book ID
      orderHash: '0x...', // Replace with actual order hash
    });
    console.log('Order cancelled successfully:', result.digest);
  } catch (error) {
    console.error('Error cancelling order:', error);
  }
  */

  console.log('\n=== SDK Information ===');
  console.log('Package ID:', sdk.getPackageId());
  console.log('Module:', sdk.getModule());
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main }; 
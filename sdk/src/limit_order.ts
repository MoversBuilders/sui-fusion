import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Order, FillOrderParams, CreateOrderParams, CancelOrderParams } from './types/index.types';

export class LimitOrderSDK {
  private client: SuiClient;
  private packageId: string;
  private module: string;

  constructor(client: SuiClient, packageId: string, module: string = 'limit_order') {
    this.client = client;
    this.packageId = packageId;
    this.module = module;
  }

  /**
   * Create a new limit order
   * @param signer - The keypair to sign the transaction
   * @param params - Order creation parameters
   * @returns Transaction result
   */
  async createOrder(signer: Ed25519Keypair, params: CreateOrderParams) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::${this.module}::create_order`,
      arguments: [
        tx.pure.u256(params.salt),
        tx.pure.address(params.maker),
        tx.pure.address(params.receiver),
        tx.pure.address(params.makerAsset),
        tx.pure.address(params.takerAsset),
        tx.pure.u256(params.makingAmount),
        tx.pure.u256(params.takingAmount),
        tx.pure.u256(params.makerTraits),
      ],
    });

    return this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
    });
  }

  /**
   * Fill an existing limit order
   * @param signer - The keypair to sign the transaction
   * @param params - Fill order parameters
   * @returns Transaction result
   */
  async fillOrder(signer: Ed25519Keypair, params: FillOrderParams) {
    const tx = new Transaction();
    
    // Create the order object for the call
    const order = tx.moveCall({
      target: `${this.packageId}::${this.module}::create_order`,
      arguments: [
        tx.pure.u256(params.order.salt),
        tx.pure.address(params.order.maker),
        tx.pure.address(params.order.receiver),
        tx.pure.address(params.order.makerAsset),
        tx.pure.address(params.order.takerAsset),
        tx.pure.u256(params.order.makingAmount),
        tx.pure.u256(params.order.takingAmount),
        tx.pure.u256(params.order.makerTraits),
      ],
    });

    // Create the signature object
    const signature = tx.moveCall({
      target: `${this.packageId}::sui_signing::create_test_signature`,
      arguments: [],
    });

    // Create taker traits
    const takerTraits = tx.moveCall({
      target: `${this.packageId}::taker_traits::new`,
      arguments: [tx.pure.u256(params.takerTraits)],
    });

    tx.moveCall({
      target: `${this.packageId}::${this.module}::fill_order`,
      arguments: [
        tx.object(params.orderBookId),
        order,
        signature,
        tx.object(params.takerCoinId),
        tx.object(params.makerCoinId),
        tx.pure.u256(params.amount),
        takerTraits,
        tx.object(params.clockId),
      ],
    });

    return this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
    });
  }

  /**
   * Cancel an existing limit order
   * @param signer - The keypair to sign the transaction
   * @param params - Cancel order parameters
   * @returns Transaction result
   */
  async cancelOrder(signer: Ed25519Keypair, params: CancelOrderParams) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::${this.module}::cancel_order`,
      arguments: [
        tx.object(params.orderBookId),
        tx.pure.vector('u8', Array.from(params.orderHash).map(c => c.charCodeAt(0))),
      ],
    });

    return this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
    });
  }

  /**
   * Check if an order is filled
   * @param orderBookId - The order book object ID
   * @param orderHash - The order hash to check
   * @returns True if the order is filled, false otherwise
   */
  async isOrderFilled(orderBookId: string, orderHash: string): Promise<boolean> {
    try {
      // Use dry run to call the view function
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${this.packageId}::${this.module}::is_order_filled`,
        arguments: [
          tx.object(orderBookId),
          tx.pure.vector('u8', Array.from(orderHash).map(c => c.charCodeAt(0))),
        ],
      });

      // Build the transaction to get the result
      const result = await tx.build({ client: this.client });
      
      // For now, we'll use a simpler approach - query the order book object
      // In a real implementation, you'd parse the dry run result
      const orderBook = await this.client.getObject({
        id: orderBookId,
        options: { showContent: true }
      });
      
      // Check if the order hash exists in the filled_orders table
      // This is a simplified check - in practice you'd need to query the table
      return false; // Placeholder - would need proper table querying
    } catch (error) {
      console.error('Error checking if order is filled:', error);
      return false;
    }
  }

  /**
   * Hash an order to get its unique identifier
   * @param order - The order to hash
   * @returns The order hash as a hex string
   */
  async hashOrder(order: Order): Promise<string> {
    try {
      const tx = new Transaction();
      
      // Create the order object
      const orderObj = tx.moveCall({
        target: `${this.packageId}::${this.module}::create_order`,
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

      const hash = tx.moveCall({
        target: `${this.packageId}::${this.module}::hash_order`,
        arguments: [orderObj],
      });

      // Build the transaction to get the result
      const result = await tx.build({ client: this.client });
      
      // In a real implementation, you'd parse the result to get the hash
      // For now, return a placeholder
      return '0x' + '0'.repeat(64);
    } catch (error) {
      console.error('Error hashing order:', error);
      return '0x' + '0'.repeat(64);
    }
  }

  /**
   * Get order book information
   * @param orderBookId - The order book object ID
   * @returns Order book object
   */
  async getOrderBook(orderBookId: string) {
    return this.client.getObject({
      id: orderBookId,
      options: { showContent: true }
    });
  }

  /**
   * Get all filled orders from an order book
   * @param orderBookId - The order book object ID
   * @returns Array of filled order hashes
   */
  async getFilledOrders(orderBookId: string): Promise<string[]> {
    try {
      const orderBook = await this.getOrderBook(orderBookId);
      // In a real implementation, you'd query the filled_orders table
      // This is a placeholder - would need proper table querying
      return [];
    } catch (error) {
      console.error('Error getting filled orders:', error);
      return [];
    }
  }

  /**
   * Validate an order before submission
   * @param order - The order to validate
   * @returns True if the order is valid
   */
  validateOrder(order: Order): boolean {
    // Basic validation
    if (!order.salt || !order.maker || !order.receiver) {
      return false;
    }
    
    if (!order.makerAsset || !order.takerAsset) {
      return false;
    }
    
    if (!order.makingAmount || !order.takingAmount) {
      return false;
    }
    
    // Check that amounts are positive
    if (BigInt(order.makingAmount) <= 0n || BigInt(order.takingAmount) <= 0n) {
      return false;
    }
    
    return true;
  }

  /**
   * Create a simple order with default parameters
   * @param maker - The maker's address
   * @param makerAsset - The asset the maker is offering
   * @param takerAsset - The asset the maker wants
   * @param makingAmount - Amount of maker asset
   * @param takingAmount - Amount of taker asset
   * @returns Order parameters
   */
  createSimpleOrder(
    maker: string,
    makerAsset: string,
    takerAsset: string,
    makingAmount: string,
    takingAmount: string
  ): CreateOrderParams {
    return {
      salt: Date.now().toString(), // Simple salt based on timestamp
      maker,
      receiver: maker, // Default to maker as receiver
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      makerTraits: '0', // Default traits
    };
  }
}

export default LimitOrderSDK;

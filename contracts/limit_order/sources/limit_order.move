module limit_order::limit_order;

use sui::table::{Self, Table};
use sui::event;

use limit_order::order_types::{Self, Order, OrderHash};
use limit_order::fusion_address::{Self, FusionAddress};
use limit_order::amount_calculator;
use limit_order::maker_traits::{Self, MakerTraits};
use limit_order::taker_traits::{Self, TakerTraits};

// ===== Error Constants =====
const EINVALIDATED_ORDER: u64 = 0;
const ETAKING_AMOUNT_EXCEEDED: u64 = 1;
// const EPRIVATE_ORDER: u64 = 2; 
const EBAD_SIGNATURE: u64 = 3;
const EORDER_EXPIRED: u64 = 4;
// const EWRONG_SERIES_NONCE: u64 = 5;
const ESWAP_WITH_ZERO_AMOUNT: u64 = 6;
// const EPARTIAL_FILL_NOT_ALLOWED: u64 = 7;
// const EORDER_IS_NOT_SUITABLE_FOR_MASS_INVALIDATION: u64 = 8;
// const EEPOCH_MANAGER_AND_BIT_INVALIDATORS_ARE_INCOMPATIBLE: u64 = 9;
// const EREENTRANCY_DETECTED: u64 = 10;
// const EPREDICATE_IS_NOT_TRUE: u64 = 11;
// const ETAKING_AMOUNT_TOO_HIGH: u64 = 12;
// const EMAKING_AMOUNT_TOO_LOW: u64 = 13;
// const ETRANSFER_FROM_MAKER_TO_TAKER_FAILED: u64 = 14;
// const ETRANSFER_FROM_TAKER_TO_MAKER_FAILED: u64 = 15;
// const EMISMATCH_ARRAYS_LENGTHS: u64 = 16;
// const EINVALID_PERMIT2_TRANSFER: u64 = 17;
// const EINVALID_MSG_VALUE: u64 = 18;
// const EETH_TRANSFER_FAILED: u64 = 19;

// ===== Structs =====

/// Order book for tracking filled/cancelled orders
public struct OrderBook has key {
    id: UID,
    // Order tracking using Table for efficient storage and third-party access
    // Maps order hash to filled status (true = filled/cancelled)
    filled_orders: Table<vector<u8>, bool>,
}

/// Order fill result
public struct FillResult has copy, drop {
    making_amount: u256,
    taking_amount: u256,
    order_hash: vector<u8>,
}

/// Event for order filling
public struct OrderFilled has copy, drop {
    order_hash: vector<u8>,
    making_amount: u256,
    taking_amount: u256,
}

/// Event for order cancellation
public struct OrderCancelled has copy, drop {
    order_hash: vector<u8>,
}

// ===== Constructor =====

/// Initialize the order book
fun init(ctx: &mut TxContext) {
    let order_book = OrderBook {
        id: object::new(ctx),
        filled_orders: table::new(ctx),
    };
    transfer::share_object(order_book);
}

// ===== Public Functions =====

/// Create a new order
public fun create_order(
    salt: u256,
    maker: FusionAddress,
    receiver: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    maker_traits: u256,
    ctx: &mut TxContext
): Order {
    order_types::new_order(
        salt,
        maker,
        receiver,
        maker_asset,
        taker_asset,
        making_amount,
        taking_amount,
        maker_traits
    )
}

/// Hash an order for signature verification
public fun hash_order(order: &Order): vector<u8> {
    let order_hash = order_types::hash_order(order);
    order_types::hash_bytes(&order_hash)
}

/// Fill an order with signature verification
public fun fill_order(
    order_book: &mut OrderBook,
    order: &Order,
    signature: vector<u8>,
    amount: u256,
    taker_traits: TakerTraits,
    ctx: &mut TxContext
): FillResult {
    let order_hash = hash_order(order);
    let maker = fusion_address::sui_address(order_types::maker(order));
    
    // Verify signature
    assert!(verify_signature(&order_hash, signature, maker), EBAD_SIGNATURE);
    
    // Check order validity
    assert!(order_types::is_valid(order), EINVALIDATED_ORDER);
    assert!(!is_order_expired(order), EORDER_EXPIRED);
    assert!(!is_order_filled(order_book, &order_hash), EINVALIDATED_ORDER);
    
    // Calculate fill amounts
    let (making_amount, taking_amount) = calculate_fill_amounts(
        order,
        amount,
        taker_traits,
        &order_hash
    );
    
    // Validate amounts
    assert!(making_amount > 0 && taking_amount > 0, ESWAP_WITH_ZERO_AMOUNT);
    
    // Check for taking amount exceeded (when taker specifies taking amount)
    if (taking_amount > amount) {
        abort ETAKING_AMOUNT_EXCEEDED
    };
    
    // Validate that amounts are reasonable
    assert!(making_amount <= order_types::making_amount(order), EINVALIDATED_ORDER);
    assert!(taking_amount <= order_types::taking_amount(order), ETAKING_AMOUNT_EXCEEDED);
    
    // Mark order as filled
    mark_order_filled(order_book, order_hash);
    
    // Execute the swap
    execute_swap(order, making_amount, taking_amount, ctx);
    
    // Emit event
    event::emit(OrderFilled { 
        order_hash, 
        making_amount, 
        taking_amount 
    });
    
    FillResult {
        making_amount,
        taking_amount,
        order_hash,
    }
}

/// Cancel an order
public fun cancel_order(
    order_book: &mut OrderBook,
    order_hash: vector<u8>,
    ctx: &mut TxContext
) {
    let maker = tx_context::sender(ctx);
    
    // Mark order as filled (cancelled)
    mark_order_filled(order_book, order_hash);
    event::emit(OrderCancelled { order_hash });
}

/// Check if an order is filled
public fun is_order_filled(
    order_book: &OrderBook,
    order_hash: &vector<u8>
): bool {
    table::contains(&order_book.filled_orders, *order_hash)
}

// ===== Private Functions =====

/// Verify signature
fun verify_signature(
    order_hash: &vector<u8>,
    signature: vector<u8>,
    expected_signer: address
): bool {
    // TODO: Implement actual signature verification
    false
}

/// Check if order is expired
fun is_order_expired(order: &Order): bool {
    // TODO: Implement expiration check based on maker traits
    false
}

/// Calculate fill amounts based on taker preferences
fun calculate_fill_amounts(
    order: &Order,
    amount: u256,
    taker_traits: TakerTraits,
    order_hash: &vector<u8>
): (u256, u256) {
    let making_amount = order_types::making_amount(order);
    let taking_amount = order_types::taking_amount(order);
    
    // Taker always specifies taking amount (what they want to give)
    let actual_taking = amount;
    let actual_making = amount_calculator::get_making_amount(
        making_amount,
        taking_amount,
        actual_taking
    );
    
    // Adjust if making amount exceeds remaining
    if (actual_making > making_amount) {
        let adjusted_making = making_amount;
        let adjusted_taking = amount_calculator::get_taking_amount(
            making_amount,
            taking_amount,
            adjusted_making
        );
        (adjusted_making, adjusted_taking)
    } else {
        (actual_making, actual_taking)
    }
}

/// Mark order as filled
fun mark_order_filled(
    order_book: &mut OrderBook,
    order_hash: vector<u8>
) {
    table::add(&mut order_book.filled_orders, order_hash, true);
}

/// Execute the actual swap
fun execute_swap(
    order: &Order,
    making_amount: u256,
    taking_amount: u256,
    ctx: &mut TxContext
) {
    // TODO: Implement actual token transfer logic
}
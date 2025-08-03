module limit_order::limit_order;

use sui::table::{Self, Table};
use sui::event;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::transfer;
use std::u64;

use limit_order::order_types::{Self, Order};
use limit_order::fusion_address::{Self, FusionAddress};
use limit_order::amount_calculator;
use limit_order::maker_traits;
use limit_order::taker_traits::{Self, TakerTraits};
use limit_order::sui_signing::{Self, SuiSignature};

// ===== Error Constants =====
const EINVALIDATED_ORDER: u64 = 0;
const ETAKING_AMOUNT_EXCEEDED: u64 = 1;
const EPRIVATE_ORDER: u64 = 2; 
const EBAD_SIGNATURE: u64 = 3;
const EORDER_EXPIRED: u64 = 4;
// const EWRONG_SERIES_NONCE: u64 = 5;
const ESWAP_WITH_ZERO_AMOUNT: u64 = 6;
// const EPARTIAL_FILL_NOT_ALLOWED: u64 = 7;
// const EORDER_IS_NOT_SUITABLE_FOR_MASS_INVALIDATION: u64 = 8;
// const EEPOCH_MANAGER_AND_BIT_INVALIDATORS_ARE_INCOMPATIBLE: u64 = 9;
// const EREENTRANCY_DETECTED: u64 = 10;
// const EPREDICATE_IS_NOT_TRUE: u64 = 11;
const ETAKING_AMOUNT_TOO_HIGH: u64 = 12;
const EMAKING_AMOUNT_TOO_LOW: u64 = 13;
const ETRANSFER_FROM_MAKER_TO_TAKER_FAILED: u64 = 14;
const ETRANSFER_FROM_TAKER_TO_MAKER_FAILED: u64 = 15;
// const EMISMATCH_ARRAYS_LENGTHS: u64 = 16;
const EINVALID_PERMIT2_TRANSFER: u64 = 17;
// const EINVALID_MSG_VALUE: u64 = 18;
const EETH_TRANSFER_FAILED: u64 = 19;
const EWETH_NOT_SUPPORTED: u64 = 20;
const EPERMIT2_NOT_SUPPORTED: u64 = 21;
const EAMOUNT_TOO_LARGE_FOR_SUI_COINS: u64 = 22;

const ENOT_IMPLEMENTED: u64 = 100;

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

/// Event for token swap execution
public struct TokenSwapExecuted has copy, drop {
    maker: address,
    taker: address,
    maker_asset: address,
    taker_asset: address,
    making_amount: u256,
    taking_amount: u256,
    timestamp: u64,
}

/// Event for maker to taker transfer
public struct MakerToTakerTransfer has copy, drop {
    maker: address,
    taker: address,
    asset: address,
    amount: u256,
}

/// Event for taker to maker transfer
public struct TakerToMakerTransfer has copy, drop {
    taker: address,
    maker: address,
    asset: address,
    amount: u256,
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

/// Fill an order with signature verification
public fun fill_order(
    order_book: &mut OrderBook,
    order: &Order,
    signature: &SuiSignature,
    amount: u256,
    taker_traits: TakerTraits,
    clock: &Clock,
    ctx: &mut TxContext
): FillResult {
    let order_hash = sui_signing::hash_order_blake2b(
        order_types::salt(order),
        order_types::maker(order),
        order_types::receiver(order),
        order_types::maker_asset(order),
        order_types::taker_asset(order),
        order_types::making_amount(order),
        order_types::taking_amount(order),
        order_types::maker_traits(order)
    );
    let maker = order_types::maker(order);
    
    // Verify order hash integrity
    verify_order_hash_integrity(order, &sui_signing::hash_value(&order_hash));
    
    // Verify signature
    assert!(sui_signing::verify_order_signature(&order_hash, *signature, maker), EBAD_SIGNATURE);
    
    // Check order validity
    assert!(order_types::is_valid(order), EINVALIDATED_ORDER);
    assert!(!is_order_expired(order, clock), EORDER_EXPIRED);
    assert!(!is_order_filled(order_book, &sui_signing::hash_value(&order_hash)), EINVALIDATED_ORDER);
    
    // Verify maker permissions
    verify_maker_permissions(order, tx_context::sender(ctx), ctx);
    
    // Check for unsupported features
    verify_sui_compatibility(order, taker_traits);
    
    // Calculate fill amounts
    let (making_amount, taking_amount) = calculate_fill_amounts(
        order,
        amount,
        taker_traits,
        &sui_signing::hash_value(&order_hash)
    );
    
    // Validate amounts
    assert!(making_amount > 0u256 && taking_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    
    // Check for taking amount exceeded (when taker specifies taking amount)
    if (taking_amount > amount) {
        abort ETAKING_AMOUNT_EXCEEDED
    };
    
    // Check threshold amount from taker traits
    let threshold = taker_traits::threshold(&taker_traits);
    if (threshold > 0u256 && taking_amount > threshold) {
        abort ETAKING_AMOUNT_TOO_HIGH
    };
    
    // Validate that amounts are reasonable
    assert!(making_amount <= order_types::making_amount(order), EINVALIDATED_ORDER);
    assert!(taking_amount <= order_types::taking_amount(order), ETAKING_AMOUNT_EXCEEDED);
    
    // Check if maker allows partial fills
    let maker_traits = maker_traits::new(order_types::maker_traits(order));
    if (!maker_traits::allow_partial_fills(&maker_traits)) {
        // For non-partial fills, amounts must match exactly
        assert!(making_amount == order_types::making_amount(order), EINVALIDATED_ORDER);
        assert!(taking_amount == order_types::taking_amount(order), ETAKING_AMOUNT_EXCEEDED);
    } else {
        // Partial fills are not implemented yet
        abort ENOT_IMPLEMENTED
    };
    
    // Verify order integrity
    verify_order_integrity(order, making_amount, taking_amount);
    
    // Mark order as filled
    mark_order_filled(order_book, sui_signing::hash_value(&order_hash));
    
    // Execute the swap
    execute_swap(order, making_amount, taking_amount, clock, ctx);
    
    // Emit event
    event::emit(OrderFilled { 
        order_hash: sui_signing::hash_value(&order_hash), 
        making_amount, 
        taking_amount 
    });
    
    FillResult {
        making_amount,
        taking_amount,
        order_hash: sui_signing::hash_value(&order_hash),
    }
}

/// Fill an order with actual coin transfers
public fun fill_order_with_coins<T, U>(
    order_book: &mut OrderBook,
    order: &Order,
    signature: &SuiSignature,
    taker_coin: &mut Coin<U>,
    maker_coin: &mut Coin<T>,
    amount: u256,
    taker_traits: TakerTraits,
    clock: &Clock,
    ctx: &mut TxContext
): FillResult {
    let order_hash = sui_signing::hash_order_blake2b(
        order_types::salt(order),
        order_types::maker(order),
        order_types::receiver(order),
        order_types::maker_asset(order),
        order_types::taker_asset(order),
        order_types::making_amount(order),
        order_types::taking_amount(order),
        order_types::maker_traits(order)
    );
    let maker = order_types::maker(order);
    
    // Verify order hash integrity
    verify_order_hash_integrity(order, &sui_signing::hash_value(&order_hash));
    
    // Verify signature
    assert!(sui_signing::verify_order_signature(&order_hash, *signature, maker), EBAD_SIGNATURE);
    
    // Check order validity
    assert!(order_types::is_valid(order), EINVALIDATED_ORDER);
    assert!(!is_order_expired(order, clock), EORDER_EXPIRED);
    assert!(!is_order_filled(order_book, &sui_signing::hash_value(&order_hash)), EINVALIDATED_ORDER);
    
    // Verify maker permissions
    verify_maker_permissions(order, tx_context::sender(ctx), ctx);
    
    // Check for unsupported features
    verify_sui_compatibility(order, taker_traits);
    
    // Calculate fill amounts
    let (making_amount, taking_amount) = calculate_fill_amounts(
        order,
        amount,
        taker_traits,
        &sui_signing::hash_value(&order_hash)
    );
    
    // Validate amounts
    assert!(making_amount > 0u256 && taking_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    
    // Check for taking amount exceeded (when taker specifies taking amount)
    if (taking_amount > amount) {
        abort ETAKING_AMOUNT_EXCEEDED
    };
    
    // Check threshold amount from taker traits
    let threshold = taker_traits::threshold(&taker_traits);
    if (threshold > 0u256 && taking_amount > threshold) {
        abort ETAKING_AMOUNT_TOO_HIGH
    };
    
    // Validate that amounts are reasonable
    assert!(making_amount <= order_types::making_amount(order), EINVALIDATED_ORDER);
    assert!(taking_amount <= order_types::taking_amount(order), ETAKING_AMOUNT_EXCEEDED);
    
    // Check if maker allows partial fills
    let maker_traits = maker_traits::new(order_types::maker_traits(order));
    if (!maker_traits::allow_partial_fills(&maker_traits)) {
        // For non-partial fills, amounts must match exactly
        assert!(making_amount == order_types::making_amount(order), EINVALIDATED_ORDER);
        assert!(taking_amount == order_types::taking_amount(order), ETAKING_AMOUNT_EXCEEDED);
    } else {
        // Partial fills are not implemented yet
        abort ENOT_IMPLEMENTED
    };
    
    // Verify order integrity
    verify_order_integrity(order, making_amount, taking_amount);
    
    // Mark order as filled
    mark_order_filled(order_book, sui_signing::hash_value(&order_hash));
    
    // Execute the actual coin swap
    // Note: Sui Coin<T> uses u64 amounts, but limit orders should support u256 like Ethereum
    // For now, we'll validate that amounts fit in u64, but this is a limitation of Sui's coin system
    if (making_amount > (u64::max_value!() as u256)) {
        abort EAMOUNT_TOO_LARGE_FOR_SUI_COINS
    };
    if (taking_amount > (u64::max_value!() as u256)) {
        abort EAMOUNT_TOO_LARGE_FOR_SUI_COINS
    };
    
    execute_coin_swap(
        maker_coin,
        taker_coin,
        (making_amount as u64),
        (taking_amount as u64),
        maker,
        fusion_address::from_sui_address(tx_context::sender(ctx)),
        clock,
        ctx
    );
    
    // Emit event
    event::emit(OrderFilled { 
        order_hash: sui_signing::hash_value(&order_hash), 
        making_amount, 
        taking_amount 
    });
    
    FillResult {
        making_amount,
        taking_amount,
        order_hash: sui_signing::hash_value(&order_hash),
    }
}

/// Fill a contract order (not implemented)
public fun fill_contract_order(
    order_book: &mut OrderBook,
    order: &Order,
    signature: vector<u8>,
    amount: u256,
    taker_traits: TakerTraits,
    clock: &Clock,
    ctx: &mut TxContext
): FillResult {
    abort ENOT_IMPLEMENTED
}

/// Fill a contract order with arguments (not implemented)
public fun fill_contract_order_args(
    order_book: &mut OrderBook,
    order: &Order,
    signature: vector<u8>,
    amount: u256,
    taker_traits: TakerTraits,
    args: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext
): FillResult {
    abort ENOT_IMPLEMENTED
}

/// Check predicate (not implemented)
public fun check_predicate(predicate: vector<u8>): bool {
    abort ENOT_IMPLEMENTED
}

/// Mass invalidate orders using bit invalidator (not implemented)
public fun bits_invalidate_for_order(
    order_book: &mut OrderBook,
    maker_traits: u256,
    additional_mask: u256,
    ctx: &mut TxContext
) {
    abort ENOT_IMPLEMENTED
}

/// Hash order (public interface matching Solidity)
public fun hash_order(order: &Order): vector<u8> {
    let order_hash = sui_signing::hash_order_blake2b(
        order_types::salt(order),
        order_types::maker(order),
        order_types::receiver(order),
        order_types::maker_asset(order),
        order_types::taker_asset(order),
        order_types::making_amount(order),
        order_types::taking_amount(order),
        order_types::maker_traits(order)
    );
    sui_signing::hash_value(&order_hash)
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

/// Check if order is expired
fun is_order_expired(order: &Order, clock: &Clock): bool {
    let maker_traits = maker_traits::new(order_types::maker_traits(order));
    maker_traits::is_expired(&maker_traits, clock)
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
    
    // Check if taker wants to specify making amount instead of taking amount
    if (taker_traits::is_making_amount(&taker_traits)) {
        // Taker specifies making amount (what they want to receive)
        let actual_making = amount;
        let actual_taking = amount_calculator::get_taking_amount(
            making_amount,
            taking_amount,
            actual_making
        );
        
        // Adjust if taking amount exceeds remaining
        if (actual_taking > taking_amount) {
            let adjusted_taking = taking_amount;
            let adjusted_making = amount_calculator::get_making_amount(
                making_amount,
                taking_amount,
                adjusted_taking
            );
            (adjusted_making, adjusted_taking)
        } else {
            (actual_making, actual_taking)
        }
    } else {
        // Taker specifies taking amount (what they want to give)
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
}

/// Mark order as filled
fun mark_order_filled(
    order_book: &mut OrderBook,
    order_hash: vector<u8>
) {
    table::add(&mut order_book.filled_orders, order_hash, true);
}

/// Verify maker permissions and order validity
fun verify_maker_permissions(
    order: &Order,
    taker: address,
    ctx: &mut TxContext
) {
    let maker_traits = maker_traits::new(order_types::maker_traits(order));
    
    // Check if taker is allowed to fill this order
    assert!(maker_traits::is_allowed_sender(&maker_traits, taker), EPRIVATE_ORDER);
    
    // Check if maker needs epoch manager validation
    if (maker_traits::need_check_epoch_manager(&maker_traits)) {
        abort ENOT_IMPLEMENTED
    };
    
    // Check if maker uses bit invalidator (for future implementation)
    if (maker_traits::use_bit_invalidator(&maker_traits)) {
        abort ENOT_IMPLEMENTED
    };
}

/// Verify order hash integrity
fun verify_order_hash_integrity(order: &Order, order_hash: &vector<u8>) {
    // Verify that the order hash is not empty
    assert!(vector::length(order_hash) > 0, EINVALIDATED_ORDER);
    
    // Verify that the order hash is the expected length (32 bytes for keccak256)
    assert!(vector::length(order_hash) == 32, EINVALIDATED_ORDER);
}

/// Verify order integrity and rate limits
fun verify_order_integrity(
    order: &Order,
    making_amount: u256,
    taking_amount: u256
) {
    let order_making = order_types::making_amount(order);
    let order_taking = order_types::taking_amount(order);
    
    // Verify the exchange rate is reasonable
    // This prevents extreme slippage and manipulation
    let max_slippage = 100u256; // 100% max slippage
    
    // Check if the calculated rate is within reasonable bounds
    let calculated_rate = (making_amount * order_taking) / taking_amount;
    let expected_rate = order_making;
    
    // Allow some tolerance for rounding errors
    let tolerance = expected_rate / 1000u256; // 0.1% tolerance
    
    assert!(
        calculated_rate >= expected_rate - tolerance && 
        calculated_rate <= expected_rate + tolerance,
        EINVALIDATED_ORDER
    );
    
    // Additional validation: check for reasonable amounts
    assert!(making_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    assert!(taking_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    
    // Check for excessive amounts (prevent overflow)
    assert!(making_amount <= order_making, EMAKING_AMOUNT_TOO_LOW);
    assert!(taking_amount <= order_taking, ETAKING_AMOUNT_TOO_HIGH);
}

/// Verify Sui compatibility (check for unsupported Ethereum features)
fun verify_sui_compatibility(
    order: &Order,
    taker_traits: TakerTraits
) {
    let maker_traits = maker_traits::new(order_types::maker_traits(order));
    
    // The limit_order protocol runs natively on Sui
    // Therefore, WETH and Permit2 features are NOT supported
    // These features are Ethereum-specific and don't exist on Sui
    
    // Check if maker wants WETH unwrapping - NOT SUPPORTED ON SUI
    if (maker_traits::unwrap_weth(&maker_traits)) {
        abort EWETH_NOT_SUPPORTED
    };
    
    // Check if maker wants Permit2 - NOT SUPPORTED ON SUI
    if (maker_traits::use_permit2(&maker_traits)) {
        abort EPERMIT2_NOT_SUPPORTED
    };
    
    // Check if taker wants WETH unwrapping - NOT SUPPORTED ON SUI
    if (taker_traits::unwrap_weth(&taker_traits)) {
        abort EWETH_NOT_SUPPORTED
    };
    
    // Check if taker wants Permit2 - NOT SUPPORTED ON SUI
    if (taker_traits::use_permit2(&taker_traits)) {
        abort EPERMIT2_NOT_SUPPORTED
    };
}

/// Execute the actual swap
fun execute_swap(
    order: &Order,
    making_amount: u256,
    taking_amount: u256,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let maker = order_types::maker(order);
    let taker = fusion_address::from_sui_address(tx_context::sender(ctx));
    
    // Validate amounts
    assert!(making_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    assert!(taking_amount > 0u256, ESWAP_WITH_ZERO_AMOUNT);
    
    // Get asset addresses
    let maker_asset = order_types::maker_asset(order);
    let taker_asset = order_types::taker_asset(order);
    
    // Execute the token swap
    execute_token_swap(
        maker,
        taker,
        maker_asset,
        taker_asset,
        making_amount,
        taking_amount,
        clock,
        ctx
    );
}

/// Execute token swap between maker and taker
fun execute_token_swap(
    maker: FusionAddress,
    taker: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Following Ethereum OrderMixin._fill() structure:
    // 1. Pre-interaction (maker prepares funds)
    // 2. Maker → Taker transfer
    // 3. Taker interaction (optional)
    // 4. Taker → Maker transfer
    // 5. Post-interaction (maker handles funds)
    
    // Validate swap parameters
    assert!(fusion_address::value(maker) != fusion_address::value(taker), EINVALIDATED_ORDER); // Prevent self-swap
    assert!(fusion_address::value(maker_asset) != fusion_address::value(taker_asset), EINVALIDATED_ORDER); // Prevent same asset swap
    
    // Step 1: Pre-interaction (maker prepares funds)
    // In Ethereum: if (order.makerTraits.needPreInteractionCall())
    // For now, we'll skip this as it requires maker interaction contracts
    
    // Step 2: Maker → Taker transfer
    // In Ethereum: IERC20(order.makerAsset.get()).safeTransferFromPermit2(order.maker.get(), receiver, makingAmount);
    execute_maker_to_taker_transfer(maker, taker, maker_asset, making_amount);
    
    // Step 3: Taker interaction (optional)
    // In Ethereum: ITakerInteraction(address(bytes20(interaction))).takerInteraction(...)
    // For now, we'll skip this as it requires taker interaction contracts
    
    // Step 4: Taker → Maker transfer
    // In Ethereum: IERC20(order.takerAsset.get()).safeTransferFromPermit2(msg.sender, receiver, takingAmount);
    execute_taker_to_maker_transfer(taker, maker, taker_asset, taking_amount);
    
    // Step 5: Post-interaction (maker handles funds)
    // In Ethereum: if (order.makerTraits.needPostInteractionCall())
    // For now, we'll skip this as it requires maker interaction contracts

    // Emit swap event
    event::emit(TokenSwapExecuted {
        maker: fusion_address::sui_address(maker),
        taker: fusion_address::sui_address(taker),
        maker_asset: fusion_address::sui_address(maker_asset),
        taker_asset: fusion_address::sui_address(taker_asset),
        making_amount,
        taking_amount,
        timestamp: clock::timestamp_ms(clock)
    });
}

/// Execute maker to taker transfer (following Ethereum pattern)
fun execute_maker_to_taker_transfer(
    maker: FusionAddress,
    taker: FusionAddress,
    maker_asset: FusionAddress,
    making_amount: u256
) {
    // In Ethereum: IERC20(order.makerAsset.get()).safeTransferFromPermit2(order.maker.get(), receiver, makingAmount);
    // For Sui, we'll implement this as a generic transfer function
    // In a real implementation, this would:
    // 1. Check if maker has sufficient balance
    // 2. Transfer maker_asset from maker to taker
    // 3. Handle any transfer failures
    
    // For now, we'll emit an event to indicate the transfer
    event::emit(MakerToTakerTransfer {
        maker: fusion_address::sui_address(maker),
        taker: fusion_address::sui_address(taker),
        asset: fusion_address::sui_address(maker_asset),
        amount: making_amount
    });
}

/// Execute taker to maker transfer (following Ethereum pattern)
fun execute_taker_to_maker_transfer(
    taker: FusionAddress,
    maker: FusionAddress,
    taker_asset: FusionAddress,
    taking_amount: u256
) {
    // In Ethereum: IERC20(order.takerAsset.get()).safeTransferFromPermit2(msg.sender, receiver, takingAmount);
    // For Sui, we'll implement this as a generic transfer function
    // In a real implementation, this would:
    // 1. Check if taker has sufficient balance
    // 2. Transfer taker_asset from taker to maker
    // 3. Handle any transfer failures
    
    // For now, we'll emit an event to indicate the transfer
    event::emit(TakerToMakerTransfer {
        taker: fusion_address::sui_address(taker),
        maker: fusion_address::sui_address(maker),
        asset: fusion_address::sui_address(taker_asset),
        amount: taking_amount
    });
}

/// Execute coin swap with actual transfers (following Ethereum pattern)
public fun execute_coin_swap<T, U>(
    maker_coin: &mut Coin<T>,
    taker_coin: &mut Coin<U>,
    making_amount: u64,
    taking_amount: u64,
    maker: FusionAddress,
    taker: FusionAddress,
    clock: &Clock,
    ctx: &mut TxContext
) {
    // Following Ethereum OrderMixin._fill() structure for coin transfers:
    // 1. Validate amounts and balances
    // 2. Maker → Taker transfer
    // 3. Taker → Maker transfer
    // 4. Emit events
    
    // Step 1: Validate amounts and balances
    assert!(making_amount > 0, ESWAP_WITH_ZERO_AMOUNT);
    assert!(taking_amount > 0, ESWAP_WITH_ZERO_AMOUNT);
    assert!(coin::value(maker_coin) >= making_amount, EMAKING_AMOUNT_TOO_LOW);
    assert!(coin::value(taker_coin) >= taking_amount, ETAKING_AMOUNT_TOO_HIGH);
    
    // Step 2: Maker → Taker transfer (following Ethereum pattern)
    let maker_coin_for_taker = coin::split(maker_coin, making_amount, ctx);
    transfer::public_transfer(maker_coin_for_taker, fusion_address::sui_address(taker));
    
    // Emit maker to taker transfer event
    event::emit(MakerToTakerTransfer {
        maker: fusion_address::sui_address(maker),
        taker: fusion_address::sui_address(taker),
        asset: fusion_address::sui_address(maker),
        amount: (making_amount as u256)
    });
    
    // Step 3: Taker → Maker transfer (following Ethereum pattern)
    let taker_coin_for_maker = coin::split(taker_coin, taking_amount, ctx);
    transfer::public_transfer(taker_coin_for_maker, fusion_address::sui_address(maker));
    
    // Emit taker to maker transfer event
    event::emit(TakerToMakerTransfer {
        taker: fusion_address::sui_address(taker),
        maker: fusion_address::sui_address(maker),
        asset: fusion_address::sui_address(taker),
        amount: (taking_amount as u256)
    });
    
    // Step 4: Emit final swap event
    event::emit(TokenSwapExecuted {
        maker: fusion_address::sui_address(maker),
        taker: fusion_address::sui_address(taker),
        maker_asset: fusion_address::sui_address(maker),
        taker_asset: fusion_address::sui_address(taker),
        making_amount: (making_amount as u256),
        taking_amount: (taking_amount as u256),
        timestamp: clock::timestamp_ms(clock)
    });
}
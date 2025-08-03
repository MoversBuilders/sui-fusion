module limit_order::order_types;

use sui::hash;
use sui::bcs;
use limit_order::fusion_address::FusionAddress;

/// Represents a limit order
public struct Order has copy, drop, store {
    salt: u256,
    maker: FusionAddress,
    receiver: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    maker_traits: u256
}

/// Order hash for signature verification
public struct OrderHash has copy, drop, store {
    value: vector<u8>
}

/// Creates a new order
/// @param salt Random salt for uniqueness
/// @param maker The address of the order maker
/// @param receiver The address to receive the taker asset
/// @param maker_asset The asset the maker is selling
/// @param taker_asset The asset the maker wants to receive
/// @param making_amount The amount of maker_asset being sold
/// @param taking_amount The amount of taker_asset to receive
/// @param maker_traits Maker preferences and flags
/// @return A new Order instance
public fun new_order(
    salt: u256,
    maker:  FusionAddress,
    receiver: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    maker_traits: u256
): Order {
    Order {
        salt,
        maker,
        receiver,
        maker_asset,
        taker_asset,
        making_amount,
        taking_amount,
        maker_traits,
    }
}

/// Calculates the hash of an order for signature verification
/// @param order The order to hash
/// @return The order hash
public fun hash_order(order: &Order): OrderHash {
    let mut serialized = vector::empty<u8>();
    
    // Serialize order fields in a deterministic way
    serialized.append(order.maker.bytes());
    serialized.append(order.receiver.bytes());
    serialized.append(order.maker_asset.bytes());
    serialized.append(order.taker_asset.bytes());
    serialized.append(bcs::to_bytes(&order.making_amount));
    serialized.append(bcs::to_bytes(&order.taking_amount));
    serialized.append(bcs::to_bytes(&order.maker_traits));
    
    OrderHash { value: hash::keccak256(&serialized) }
}

/// Gets the order hash bytes
/// @param order_hash The order hash
/// @return The hash bytes
public fun hash_bytes(order_hash: &OrderHash): vector<u8> {
    order_hash.value
}

/// Creates an OrderHash from bytes (for internal use)
/// @param value The hash bytes
/// @return The OrderHash
public fun create_order_hash(value: vector<u8>): OrderHash {
    OrderHash { value }
}

/// Validates that an order has valid amounts
/// @param order The order to validate
/// @return True if the order is valid
public fun is_valid(order: &Order): bool {
    order.making_amount > 0 && order.taking_amount > 0
}

/// Gets the salt
/// @param order The order
/// @return The salt
public fun salt(order: &Order): u256 {
    order.salt
}

/// Gets the maker address
/// @param order The order
/// @return The maker address
public fun maker(order: &Order): FusionAddress {
    order.maker
}

/// Gets the receiver address
/// @param order The order
/// @return The receiver address
public fun receiver(order: &Order): FusionAddress {
    order.receiver
}

/// Gets the maker asset
/// @param order The order
/// @return The maker asset address
public fun maker_asset(order: &Order): FusionAddress {
    order.maker_asset
}

/// Gets the taker asset
/// @param order The order
/// @return The taker asset address
public fun taker_asset(order: &Order): FusionAddress {
    order.taker_asset
}

/// Gets the making amount
/// @param order The order
/// @return The making amount
public fun making_amount(order: &Order): u256 {
    order.making_amount
}

/// Gets the taking amount
/// @param order The order
/// @return The taking amount
public fun taking_amount(order: &Order): u256 {
    order.taking_amount
}

/// Gets the maker traits
/// @param order The order
/// @return The maker traits
public fun maker_traits(order: &Order): u256 {
    order.maker_traits
} 
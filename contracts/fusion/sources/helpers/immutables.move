module fusion::immutables;

use sui::hash;
use limit_order::fusion_address;
use fusion::timelocks;
use sui::bcs;

// const ESCROW_IMMUTABLES_SIZE: u16 = 0x100;

/// Immutables struct: represents the immutable fields of an escrow
public struct Immutables has copy, drop, store {
    order_hash: vector<u8>, // bytes32
    hashlock: vector<u8>, // bytes32
    maker: fusion_address::FusionAddress,
    taker: fusion_address::FusionAddress,
    token: fusion_address::FusionAddress,
    amount: u256,
    safety_deposit: u256,
    timelocks: timelocks::Timelocks,
}

/// Hash the Immutables struct using optimized serialization
/// @param immutables The Immutables struct to hash
/// @return The keccak256 hash of the serialized struct
public fun hash(immutables: &Immutables): vector<u8> {
    let mut serialized = vector::empty<u8>();

    serialized.append(immutables.order_hash);
    serialized.append(immutables.hashlock);
    serialized.append(immutables.maker.bytes());
    serialized.append(immutables.taker.bytes());
    serialized.append(immutables.token.bytes());
    serialized.append(bcs::to_bytes(&immutables.amount));
    serialized.append(bcs::to_bytes(&immutables.safety_deposit));
    serialized.append(timelocks::bytes(&immutables.timelocks));

    // TODO: Validate that serialized.length() == 256 bytes
    // Suffices to check that order_hash and hashlock are 32 bytes each

    hash::keccak256(&serialized)
}

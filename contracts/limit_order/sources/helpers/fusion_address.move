// Implements the AddressLib.sol library from 1inch/solidity-utils
// for working with various (EVM, Sui, Solana...) addresses encoded as uint256 values.
// Also see Sui bridge's crypto.move

module limit_order::fusion_address;

use sui::bcs;
use sui::address;

/// Represents an address as a uint256 value, which can include flags in the highest bits
public struct FusionAddress has copy, drop, store {
    value: u256
}

/// Mask for extracting the lower 160 bits (20 bytes) for EVM addresses
const LOW_160_BIT_MASK: u256 = (1 << 160) - 1;

/// Converts a FusionAddress to its byte vector representation
/// @param a The FusionAddress to convert
/// @return The byte representation of the address
public fun bytes(a: FusionAddress): vector<u8> {
    bcs::to_bytes(&a.value)
}

/// Extracts the EVM address bytes from a FusionAddress by masking the lower 160 bits
/// @param a The FusionAddress to convert to EVM format
/// @return The EVM address bytes (20 bytes)
public fun evm_bytes(a: FusionAddress): vector<u8> {
    // Convert to address by masking the lower 160 bits
    let masked: u256 = a.value & LOW_160_BIT_MASK;
    bcs::to_bytes(&masked)
}

/// Converts a FusionAddress to a Sui native address
/// @param a The FusionAddress to convert
/// @return The corresponding Sui address
public fun sui_address(a: FusionAddress): address {
    address::from_bytes(bcs::to_bytes(&a.value))
}

/// Checks if a specific flag is set in an EVM address.
/// Flags are stored in the highest bits of the uint256 value
/// @param a The FusionAddress to check
/// @param flag The flag to check for
/// @return True if the flag is set, false otherwise
public fun evm_flag(a: FusionAddress, flag: u256): bool {
    (a.value & flag) != 0
}

/// Creates a FusionAddress from a Sui address
/// @param addr The Sui address to convert
/// @return The corresponding FusionAddress
public fun from_sui_address(addr: address): FusionAddress {
    FusionAddress { value: address::to_u256(addr) }
}

/// Gets the raw u256 value from a FusionAddress
/// @param a The FusionAddress to get the value from
/// @return The raw u256 value
public fun value(a: FusionAddress): u256 {
    a.value
}
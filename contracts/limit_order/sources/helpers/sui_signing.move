module limit_order::sui_signing;

use sui::hash;
use sui::bcs;
use sui::ed25519;
use limit_order::fusion_address::{Self, FusionAddress};
use limit_order::order_types::{Self, OrderHash};

// ===== Sui Signing Constants =====

/// Ed25519 Pure signature flag
const ED25519_FLAG: u8 = 0x00;

// ===== Structs =====

/// Sui signature wrapper
public struct SuiSignature has copy, drop, store {
    flag: u8,
    signature: vector<u8>,
    public_key: vector<u8>
}

// ===== Order Hashing Functions =====

/// Creates a hash of an order for signing using Blake2b256
/// @param salt Order salt
/// @param maker Maker FusionAddress
/// @param receiver Receiver FusionAddress
/// @param maker_asset Maker asset FusionAddress
/// @param taker_asset Taker asset FusionAddress
/// @param making_amount Making amount
/// @param taking_amount Taking amount
/// @param maker_traits Maker traits
/// @return The order hash
public fun hash_order_blake2b(
    salt: u256,
    maker: FusionAddress,
    receiver: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    maker_traits: u256
): OrderHash {
    let mut order_data = vector::empty<u8>();
    
    // Serialize order fields in a deterministic order
    order_data.append(bcs::to_bytes(&salt));
    order_data.append(fusion_address::bytes(maker));
    order_data.append(fusion_address::bytes(receiver));
    order_data.append(fusion_address::bytes(maker_asset));
    order_data.append(fusion_address::bytes(taker_asset));
    order_data.append(bcs::to_bytes(&making_amount));
    order_data.append(bcs::to_bytes(&taking_amount));
    order_data.append(bcs::to_bytes(&maker_traits));
    
    // Use Blake2b hash (Sui's default hash)
    order_types::create_order_hash(hash::blake2b256(&order_data))
}

/// Gets the order hash value
/// @param hash The order hash
/// @return The hash bytes
public fun hash_value(hash: &OrderHash): vector<u8> {
    order_types::hash_bytes(hash)
}

// ===== Signature Creation Functions =====

/// Creates a Sui signature from components
/// @param flag The signature scheme flag
/// @param signature The signature bytes
/// @param public_key The public key bytes
/// @return The Sui signature
public fun create_signature(
    flag: u8,
    signature: vector<u8>,
    public_key: vector<u8>
): SuiSignature {
    SuiSignature { flag, signature, public_key }
}

/// Gets the signature flag
/// @param sig The Sui signature
/// @return The flag
public fun get_flag(sig: &SuiSignature): u8 {
    sig.flag
}

/// Gets the signature bytes
/// @param sig The Sui signature
/// @return The signature bytes
public fun get_signature(sig: &SuiSignature): vector<u8> {
    sig.signature
}

/// Gets the public key bytes
/// @param sig The Sui signature
/// @return The public key bytes
public fun get_public_key(sig: &SuiSignature): vector<u8> {
    sig.public_key
}

// ===== Signature Verification Functions =====

/// Verifies an Ed25519 signature
/// @param message The message that was signed
/// @param signature The signature bytes
/// @param public_key The public key bytes
/// @return True if signature is valid
public fun verify_ed25519(
    message: &vector<u8>,
    signature: &vector<u8>,
    public_key: &vector<u8>
): bool {
    if (vector::length(signature) != 64) { return false };
    if (vector::length(public_key) != 32) { return false };
    
    // Use Sui's Ed25519 verification
    ed25519::ed25519_verify(message, signature, public_key)
}

/// Verifies a Sui signature (Ed25519 only)
/// @param message The message that was signed
/// @param signature The Sui signature
/// @return True if signature is valid
public fun verify_signature(
    message: &vector<u8>,
    signature: SuiSignature
): bool {
    let flag = get_flag(&signature);
    let sig_bytes = get_signature(&signature);
    let pk_bytes = get_public_key(&signature);
    
    if (flag == ED25519_FLAG) {
        verify_ed25519(message, &sig_bytes, &pk_bytes)
    } else {
        // Only Ed25519 is supported
        false
    }
}

/// Verifies an order signature (Ed25519 only)
/// @param order_hash The order hash
/// @param signature The Sui signature
/// @param expected_signer The expected signer FusionAddress
/// @return True if signature is valid and from expected signer
public fun verify_order_signature(
    order_hash: &OrderHash,
    signature: SuiSignature,
    expected_signer: FusionAddress
): bool {
    let message = hash_value(order_hash);
    
    // First verify the signature
    if (!verify_signature(&message, signature)) {
        return false
    };
    
    // Then verify the signer matches expected (Ed25519 only)
    let pk_bytes = get_public_key(&signature);
    let flag = get_flag(&signature);
    
    if (flag != ED25519_FLAG) {
        return false
    };
    
    let derived_fusion_address = derive_ed25519_fusion_address(&pk_bytes);
    fusion_address::value(derived_fusion_address) == fusion_address::value(expected_signer)
}

// ===== Address Derivation Functions =====

/// Derives FusionAddress from Ed25519 public key
/// @param public_key The Ed25519 public key bytes
/// @return The FusionAddress
public fun derive_ed25519_fusion_address(public_key: &vector<u8>): FusionAddress {
    fusion_address::from_bytes(*public_key)
}

// ===== Convenience Functions =====

/// Creates a complete order signature verification
/// @param salt Order salt
/// @param maker Maker FusionAddress
/// @param receiver Receiver FusionAddress
/// @param maker_asset Maker asset FusionAddress
/// @param taker_asset Taker asset FusionAddress
/// @param making_amount Making amount
/// @param taking_amount Taking amount
/// @param maker_traits Maker traits
/// @param signature The Sui signature
/// @param expected_signer The expected signer FusionAddress
/// @return True if signature is valid
public fun verify_order_signature_complete(
    salt: u256,
    maker: FusionAddress,
    receiver: FusionAddress,
    maker_asset: FusionAddress,
    taker_asset: FusionAddress,
    making_amount: u256,
    taking_amount: u256,
    maker_traits: u256,
    signature: SuiSignature,
    expected_signer: FusionAddress
): bool {
    let order_hash = hash_order_blake2b(
        salt,
        maker,
        receiver,
        maker_asset,
        taker_asset,
        making_amount,
        taking_amount,
        maker_traits
    );
    
    verify_order_signature(&order_hash, signature, expected_signer)
}
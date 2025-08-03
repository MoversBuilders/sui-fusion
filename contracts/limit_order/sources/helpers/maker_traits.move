module limit_order::maker_traits;

use limit_order::fusion_address;

// ===== Bit Position Constants =====
// High bits for flags (247-255)
const NO_PARTIAL_FILLS_FLAG: u256 = 1u256 << 255;
const ALLOW_MULTIPLE_FILLS_FLAG: u256 = 1u256 << 254;
const PRE_INTERACTION_CALL_FLAG: u256 = 1u256 << 252;
const POST_INTERACTION_CALL_FLAG: u256 = 1u256 << 251;
const NEED_CHECK_EPOCH_MANAGER_FLAG: u256 = 1u256 << 250;
const HAS_EXTENSION_FLAG: u256 = 1u256 << 249;
const USE_PERMIT2_FLAG: u256 = 1u256 << 248;
const UNWRAP_WETH_FLAG: u256 = 1u256 << 247;

// ===== Bit Shift Constants =====
// Low 200 bits for data
const ALLOWED_SENDER_MASK: u256 = 0xFFFFFFFFFFFFFFFFFFFFu256; // uint80.max
const EXPIRATION_OFFSET: u8 = 80;
const EXPIRATION_MASK: u256 = 0xFFFFFFFFFFu256; // uint40.max
const NONCE_OR_EPOCH_OFFSET: u8 = 120;
const NONCE_OR_EPOCH_MASK: u256 = 0xFFFFFFFFFFu256; // uint40.max
const SERIES_OFFSET: u8 = 160;
const SERIES_MASK: u256 = 0xFFFFFFFFFFu256; // uint40.max

/// Maker traits for order configuration
public struct MakerTraits has copy, drop, store {
    value: u256,
}

/// Create new maker traits
public fun new(value: u256): MakerTraits {
    MakerTraits { value }
}

/// Get the raw value of maker traits
public fun value(traits: &MakerTraits): u256 {
    traits.value
}

/// Check if maker allows partial fills
public fun allow_partial_fills(traits: &MakerTraits): bool {
    (traits.value & NO_PARTIAL_FILLS_FLAG) == 0u256
}

/// Check if maker allows multiple fills
public fun allow_multiple_fills(traits: &MakerTraits): bool {
    (traits.value & ALLOW_MULTIPLE_FILLS_FLAG) != 0u256
}

/// Check if maker uses bit invalidator
public fun use_bit_invalidator(traits: &MakerTraits): bool {
    !allow_partial_fills(traits) || !allow_multiple_fills(traits)
}

/// Check if maker needs pre-interaction call
public fun need_pre_interaction_call(traits: &MakerTraits): bool {
    (traits.value & PRE_INTERACTION_CALL_FLAG) != 0u256
}

/// Check if maker needs post-interaction call
public fun need_post_interaction_call(traits: &MakerTraits): bool {
    (traits.value & POST_INTERACTION_CALL_FLAG) != 0u256
}

/// Check if maker unwraps WETH
public fun unwrap_weth(traits: &MakerTraits): bool {
    (traits.value & UNWRAP_WETH_FLAG) != 0u256
}

/// Check if maker uses Permit2
public fun use_permit2(traits: &MakerTraits): bool {
    (traits.value & USE_PERMIT2_FLAG) != 0u256
}

/// Check if order has extension
public fun has_extension(traits: &MakerTraits): bool {
    (traits.value & HAS_EXTENSION_FLAG) != 0u256
}

/// Check if maker needs epoch manager check
public fun need_check_epoch_manager(traits: &MakerTraits): bool {
    (traits.value & NEED_CHECK_EPOCH_MANAGER_FLAG) != 0u256
}

/// Get expiration time from traits
public fun get_expiration_time(traits: &MakerTraits): u256 {
    (traits.value >> EXPIRATION_OFFSET) & EXPIRATION_MASK
}

/// Check if order is expired (matches Solidity logic)
public fun is_expired(traits: &MakerTraits): bool {
    let expiration = get_expiration_time(traits);
    expiration != 0u256 && expiration < 0u256 // TODO: Use actual timestamp
}

/// Check if specific sender is allowed
public fun is_allowed_sender(traits: &MakerTraits, sender: address): bool {
    let allowed_sender = traits.value & ALLOWED_SENDER_MASK;
    
    // If allowed_sender is 0, any sender is allowed
    if (allowed_sender == 0u256) {
        return true
    };
    
    // Convert sender address to FusionAddress for comparison
    let sender_fusion = fusion_address::from_sui_address(sender);
    let sender_value = fusion_address::value(sender_fusion);
    let sender_masked = sender_value & ALLOWED_SENDER_MASK;
    
    // Compare masked sender with allowed sender
    allowed_sender == sender_masked
}

/// Get nonce or epoch from traits
public fun nonce_or_epoch(traits: &MakerTraits): u256 {
    (traits.value >> NONCE_OR_EPOCH_OFFSET) & NONCE_OR_EPOCH_MASK
}

/// Get series from traits
public fun series(traits: &MakerTraits): u256 {
    (traits.value >> SERIES_OFFSET) & SERIES_MASK
}
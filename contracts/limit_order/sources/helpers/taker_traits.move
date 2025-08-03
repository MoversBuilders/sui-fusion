module limit_order::taker_traits;

// ===== Bit Position Constants =====
// High bits for flags (251-255)
const MAKER_AMOUNT_FLAG: u256 = 1u256 << 255;
const UNWRAP_WETH_FLAG: u256 = 1u256 << 254;
const SKIP_ORDER_PERMIT_FLAG: u256 = 1u256 << 253;
const USE_PERMIT2_FLAG: u256 = 1u256 << 252;
const ARGS_HAS_TARGET: u256 = 1u256 << 251;

// ===== Bit Shift Constants =====
// 224-247 bits: ARGS_EXTENSION_LENGTH (24 bits)
// 200-223 bits: ARGS_INTERACTION_LENGTH (24 bits)
// 0-184 bits: threshold amount (185 bits)
const ARGS_EXTENSION_LENGTH_OFFSET: u8 = 224;
const ARGS_EXTENSION_LENGTH_MASK: u256 = 0xFFFFFFu256; // 24 bits
const ARGS_INTERACTION_LENGTH_OFFSET: u8 = 200;
const ARGS_INTERACTION_LENGTH_MASK: u256 = 0xFFFFFFu256; // 24 bits
const AMOUNT_MASK: u256 = 0x000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffu256; // 185 bits

/// Taker traits for order filling preferences
public struct TakerTraits has copy, drop, store {
    value: u256,
}

/// Create new taker traits
public fun new(value: u256): TakerTraits {
    TakerTraits { value }
}

/// Get the raw value of taker traits
public fun value(traits: &TakerTraits): u256 {
    traits.value
}

/// Check if taker wants to specify making amount
public fun is_making_amount(traits: &TakerTraits): bool {
    (traits.value & MAKER_AMOUNT_FLAG) != 0u256
}

/// Check if taker skips maker permit
public fun skip_maker_permit(traits: &TakerTraits): bool {
    (traits.value & SKIP_ORDER_PERMIT_FLAG) != 0u256
}

/// Check if taker unwraps WETH
public fun unwrap_weth(traits: &TakerTraits): bool {
    (traits.value & UNWRAP_WETH_FLAG) != 0u256
}

/// Check if taker uses Permit2
public fun use_permit2(traits: &TakerTraits): bool {
    (traits.value & USE_PERMIT2_FLAG) != 0u256
}

/// Check if taker args have target
public fun args_has_target(traits: &TakerTraits): bool {
    (traits.value & ARGS_HAS_TARGET) != 0u256
}

/// Get extension length from args
public fun args_extension_length(traits: &TakerTraits): u256 {
    (traits.value >> ARGS_EXTENSION_LENGTH_OFFSET) & ARGS_EXTENSION_LENGTH_MASK
}

/// Get interaction length from args
public fun args_interaction_length(traits: &TakerTraits): u256 {
    (traits.value >> ARGS_INTERACTION_LENGTH_OFFSET) & ARGS_INTERACTION_LENGTH_MASK
}

/// Get threshold from taker traits
public fun threshold(traits: &TakerTraits): u256 {
    traits.value & AMOUNT_MASK
}
module limit_order::maker_traits;

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
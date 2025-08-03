module limit_order::taker_traits;

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
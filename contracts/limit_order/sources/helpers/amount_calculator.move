module limit_order::amount_calculator;

/// @notice Calculates maker amount from taker amount
/// @param order_maker_amount The maker amount specified in the order
/// @param order_taker_amount The taker amount specified in the order  
/// @param swap_taker_amount The actual taker amount being swapped
/// @return The calculated maker amount (floored)
public fun get_making_amount(
    order_maker_amount: u256,
    order_taker_amount: u256,
    swap_taker_amount: u256
): u256 {
    (swap_taker_amount * order_maker_amount) / order_taker_amount
}

/// @notice Calculates taker amount from maker amount
/// @param order_maker_amount The maker amount specified in the order
/// @param order_taker_amount The taker amount specified in the order
/// @param swap_maker_amount The actual maker amount being swapped
/// @return The calculated taker amount (ceiled)
public fun get_taking_amount(
    order_maker_amount: u256,
    order_taker_amount: u256,
    swap_maker_amount: u256
): u256 {
    // Add order_maker_amount - 1 before division to implement ceiling
    (swap_maker_amount * order_taker_amount + order_maker_amount - 1) / order_maker_amount
}
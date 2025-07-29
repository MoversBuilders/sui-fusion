// Implements the TimelocksLib.sol library from 1inch/cross-chain-swap 

module fusion::timelocks {
    use std::u256;
    use sui::bcs;

    const DEPLOYED_AT_MASK: u256 = 0xffffffff00000000000000000000000000000000000000000000000000000000;
    const DEPLOYED_AT_OFFSET: u8 = 224;
    const STAGE_BIT_SIZE: u8 = 32;

    /// Compact timelock storage
    public struct Timelocks has copy, drop, store {
        value: u256
    }

    /// Timelock stages
    public enum TimelockStage has copy, drop {
        SrcWithdrawal,
        SrcPublicWithdrawal,
        SrcCancellation,
        SrcPublicCancellation,
        DstWithdrawal,
        DstPublicWithdrawal,
        DstCancellation
    }

    /// Maps TimelockStage to its corresponding bit position
    /// @param stage The stage to map
    /// @return The bit position for the given stage
    fun stage_to_bit_pos(stage: TimelockStage): u8 {
        match (stage) {
            TimelockStage::SrcWithdrawal => 0,
            TimelockStage::SrcPublicWithdrawal => 1,
            TimelockStage::SrcCancellation => 2,
            TimelockStage::SrcPublicCancellation => 3,
            TimelockStage::DstWithdrawal => 4,
            TimelockStage::DstPublicWithdrawal => 5,
            TimelockStage::DstCancellation => 6,
        }
    }

    /// Creates new Timelocks with deployment timestamp
    /// @param deployed_at The timestamp of deployment
    /// @return A new Timelocks instance with the packed data
    public fun new(deployed_at: u256): Timelocks {
        let mut timelocks = Timelocks { value: 0 };
        set_deployed_at(&mut timelocks, deployed_at);
        timelocks
    }

    /// Sets the Escrow deployment timestamp
    /// @param timelocks The timelocks to modify
    /// @param value The new Escrow deployment timestamp
    fun set_deployed_at(timelocks: &mut Timelocks, value: u256) {
        timelocks.value = (timelocks.value & u256::bitwise_not(DEPLOYED_AT_MASK)) | (value << DEPLOYED_AT_OFFSET);
    }

    /// Returns the start of the rescue period
    /// @param timelocks The timelocks to get the rescue delay from
    /// @param rescue_delay The rescue delay to add
    /// @return The start of the rescue period
    public fun rescue_start(timelocks: &Timelocks, rescue_delay: u256): u256 {
        rescue_delay + (timelocks.value >> DEPLOYED_AT_OFFSET)
    }

    /// Returns the timelock value for the given stage
    /// @param timelocks The timelocks to get the value from
    /// @param stage The stage to get the value for
    /// @return The timelock value for the given stage
    public fun get(timelocks: &Timelocks, stage: TimelockStage): u256 {
        let data = timelocks.value;
        let bit_shift = (stage_to_bit_pos(stage) * STAGE_BIT_SIZE) as u8;
        // This matches the Solidity: (data >> _DEPLOYED_AT_OFFSET) + uint32(data >> bitShift)
        (data >> DEPLOYED_AT_OFFSET) + ((data >> bit_shift) & 0xFFFFFFFF)
    }

    /// Returns the byte representation of the timelocks u256 value
    /// @param timelocks The timelocks to convert
    /// @return The byte representation
    public fun bytes(timelocks: &Timelocks): vector<u8> {
        bcs::to_bytes(&timelocks.value)
    }
}
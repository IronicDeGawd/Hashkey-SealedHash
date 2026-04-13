// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal subset of HashKey Chain's IKycSBT needed by the auction.
/// Full interface in the HashKey Developer Guide, section 4.7.
interface IKycSBT {
    /// @param account Address to check.
    /// @return isValid True if the account holds an approved KYC SBT.
    /// @return level KYC level: 0 NONE, 1 BASIC, 2 ADVANCED, 3 PREMIUM, 4 ULTIMATE.
    function isHuman(address account) external view returns (bool isValid, uint8 level);
}

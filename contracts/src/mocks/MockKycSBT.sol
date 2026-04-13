// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IKycSBT} from "../interfaces/IKycSBT.sol";

/// @notice Test double for HashKey's KYC SBT. Owner toggles approval per address.
contract MockKycSBT is IKycSBT {
    mapping(address => bool) public approved;
    mapping(address => uint8) public levels;

    function setHuman(address account, bool isApproved, uint8 level) external {
        approved[account] = isApproved;
        levels[account] = level;
    }

    function isHuman(address account) external view returns (bool isValid, uint8 level) {
        return (approved[account], levels[account]);
    }
}

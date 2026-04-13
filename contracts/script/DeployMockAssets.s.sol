// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @notice Deploys the two mock ERC20s the demo needs: mock RWA (18 decimals)
///         and mock USDT (6 decimals). Logs addresses so they can be copied
///         into .env as MOCK_RWA_ADDRESS and MOCK_USDT_ADDRESS.
contract DeployMockAssetsScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        MockERC20 mRwa = new MockERC20("HashKey Mock RWA", "mRWA", 18);
        MockERC20 mUsdt = new MockERC20("HashKey Mock USDT", "mUSDT", 6);

        console.log("MOCK_RWA_ADDRESS= ", address(mRwa));
        console.log("MOCK_USDT_ADDRESS=", address(mUsdt));

        vm.stopBroadcast();
    }
}

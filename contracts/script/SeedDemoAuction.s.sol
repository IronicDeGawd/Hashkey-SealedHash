// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SealedBidAuction} from "../src/SealedBidAuction.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

/// @notice Mints mock tokens, approves the auction, and creates one demo auction.
///         The frontend reads auctionCount() on cold load so we need at least
///         one auction to exist before the UI is useful.
///
///         Reads AUCTION_ADDRESS, MOCK_RWA_ADDRESS, MOCK_USDT_ADDRESS from env.
contract SeedDemoAuctionScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address auctionAddr = vm.envAddress("AUCTION_ADDRESS");
        address rwaAddr = vm.envAddress("MOCK_RWA_ADDRESS");
        address usdtAddr = vm.envAddress("MOCK_USDT_ADDRESS");

        address deployer = vm.addr(deployerKey);
        SealedBidAuction auction = SealedBidAuction(auctionAddr);
        MockERC20 rwa = MockERC20(rwaAddr);
        MockERC20 usdt = MockERC20(usdtAddr);

        // Demo parameters. Reserve matches the spike's proof fixture so the
        // committed proof fixture generated for reserve=1000 escrow=10000 can
        // still be replayed against this auction.
        uint256 assetAmount = 1 ether;
        uint256 reserve = 1000;
        uint64 commitDuration = 1 hours;
        uint64 revealDuration = 1 hours;

        vm.startBroadcast(deployerKey);

        rwa.mint(deployer, assetAmount);
        usdt.mint(deployer, 1_000_000 * 10 ** 6);

        rwa.approve(auctionAddr, assetAmount);

        uint256 id = auction.createAuction(
            ERC20(rwaAddr), assetAmount, ERC20(usdtAddr), reserve, commitDuration, revealDuration
        );

        console.log("Seeded auction id =", id);
        console.log("  reserve        =", reserve);
        console.log("  asset amount   =", assetAmount);
        console.log("  commit ends at =", block.timestamp + commitDuration);
        console.log("  reveal ends at =", block.timestamp + commitDuration + revealDuration);

        vm.stopBroadcast();
    }
}

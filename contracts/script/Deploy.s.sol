// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SealedBidAuction} from "../src/SealedBidAuction.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {IHonkVerifier} from "../src/interfaces/IHonkVerifier.sol";
import {IKycSBT} from "../src/interfaces/IKycSBT.sol";
import {MockKycSBT} from "../src/mocks/MockKycSBT.sol";

/// @notice Deploy the auction stack to HashKey Chain testnet.
/// @dev    Reads PRIVATE_KEY and KYC_SBT_ADDRESS from env. If KYC_SBT_ADDRESS
///         is empty, deploys MockKycSBT so the demo is self-contained.
contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address liveKyc = vm.envOr("KYC_SBT_ADDRESS", address(0));
        uint8 minLevel = uint8(vm.envOr("MIN_KYC_LEVEL", uint256(1)));

        vm.startBroadcast(deployerKey);

        HonkVerifier verifier = new HonkVerifier();
        console.log("HonkVerifier:", address(verifier));

        IKycSBT kyc;
        if (liveKyc != address(0)) {
            kyc = IKycSBT(liveKyc);
            console.log("Using live KYC SBT:", liveKyc);
        } else {
            MockKycSBT mock = new MockKycSBT();
            kyc = IKycSBT(address(mock));
            console.log("MockKycSBT:", address(mock));
            console.log("  (auto-approving deployer at level", minLevel, ")");
            mock.setHuman(vm.addr(deployerKey), true, minLevel);
        }

        SealedBidAuction auction = new SealedBidAuction(IHonkVerifier(address(verifier)), kyc, minLevel);
        console.log("SealedBidAuction:", address(auction));

        vm.stopBroadcast();
    }
}

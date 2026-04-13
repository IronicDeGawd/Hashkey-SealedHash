// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {SealedBidAuction} from "../src/SealedBidAuction.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {IHonkVerifier} from "../src/interfaces/IHonkVerifier.sol";
import {IKycSBT} from "../src/interfaces/IKycSBT.sol";
import {MockKycSBT} from "../src/mocks/MockKycSBT.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

contract SealedBidAuctionTest is Test {
    SealedBidAuction internal auction;
    HonkVerifier internal verifier;
    MockKycSBT internal kyc;
    MockERC20 internal asset;
    MockERC20 internal payment;

    address internal seller = makeAddr("seller");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    // Fixture values — must match what was fed into js/generate-proof.ts.
    uint256 internal constant RESERVE = 1000;
    uint256 internal constant ESCROW_ALICE = 10_000;
    uint256 internal constant ALICE_BID = 5_000;

    uint64 internal constant COMMIT_DURATION = 1 days;
    uint64 internal constant REVEAL_DURATION = 1 days;

    function setUp() public {
        verifier = new HonkVerifier();
        kyc = new MockKycSBT();
        auction = new SealedBidAuction(IHonkVerifier(address(verifier)), IKycSBT(address(kyc)), 1);

        asset = new MockERC20("Mock RWA", "mRWA", 18);
        payment = new MockERC20("Mock USDT", "mUSDT", 6);

        asset.mint(seller, 100 ether);
        payment.mint(alice, 1_000_000);
        payment.mint(bob, 1_000_000);

        kyc.setHuman(alice, true, 2);
        kyc.setHuman(bob, true, 2);
    }

    function _createDefaultAuction() internal returns (uint256 id) {
        vm.startPrank(seller);
        asset.approve(address(auction), 1 ether);
        id = auction.createAuction(
            ERC20(address(asset)), 1 ether, ERC20(address(payment)), RESERVE, COMMIT_DURATION, REVEAL_DURATION
        );
        vm.stopPrank();
    }

    function _validProof() internal view returns (bytes memory) {
        return vm.readFileBinary("test/fixtures/valid-proof.bin");
    }

    /*//////////////////////////////////////////////////////////////
                            HAPPY PATH
    //////////////////////////////////////////////////////////////*/

    function testCreateAuctionEscrowsAsset() public {
        uint256 id = _createDefaultAuction();
        assertEq(id, 1);
        assertEq(asset.balanceOf(address(auction)), 1 ether);
        assertEq(uint8(auction.currentStatus(id)), uint8(SealedBidAuction.Status.COMMIT));
    }

    function testCommitRevealSettleHappyPath() public {
        uint256 id = _createDefaultAuction();

        uint256 nonce = 42;
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, nonce));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();

        assertEq(payment.balanceOf(address(auction)), ESCROW_ALICE);

        // Enter reveal phase.
        vm.warp(block.timestamp + COMMIT_DURATION + 1);

        vm.prank(alice);
        auction.revealBid(id, ALICE_BID, nonce);

        // Enter settlement phase.
        vm.warp(block.timestamp + REVEAL_DURATION);

        auction.settle(id);

        // Alice wins: gets the asset, pays 5000 of her escrow, is refunded 5000.
        assertEq(asset.balanceOf(alice), 1 ether);
        assertEq(payment.balanceOf(seller), ALICE_BID);
        assertEq(payment.balanceOf(alice), 1_000_000 - ALICE_BID);
        assertEq(uint8(auction.currentStatus(id)), uint8(SealedBidAuction.Status.FINALIZED));
    }
}

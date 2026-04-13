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

    /*//////////////////////////////////////////////////////////////
                           KYC + ACCESS CONTROL
    //////////////////////////////////////////////////////////////*/

    function testCommitRevertsWhenBidderNotKyc() public {
        uint256 id = _createDefaultAuction();
        kyc.setHuman(alice, false, 0);

        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        vm.expectRevert(SealedBidAuction.NotKyc.selector);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();
    }

    function testCommitRevertsWhenKycLevelTooLow() public {
        uint256 id = _createDefaultAuction();
        // minKycLevel is 1 BASIC; drop alice to 0.
        kyc.setHuman(alice, true, 0);

        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        vm.expectRevert(SealedBidAuction.NotKyc.selector);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                               PROOF GATING
    //////////////////////////////////////////////////////////////*/

    function testCommitRevertsOnEscrowMismatchWithProof() public {
        uint256 id = _createDefaultAuction();
        // Proof was generated for escrow=10000. Try escrow=9999 -> public inputs
        // differ from proof's bound values, verify returns false.
        uint256 wrongEscrow = ESCROW_ALICE - 1;
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), wrongEscrow);
        vm.expectRevert(SealedBidAuction.InvalidProof.selector);
        auction.commitBid(id, wrongEscrow, commitment, _validProof());
        vm.stopPrank();
    }

    function testCommitRevertsWhenEscrowBelowReserve() public {
        uint256 id = _createDefaultAuction();
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), RESERVE - 1);
        vm.expectRevert(SealedBidAuction.InvalidEscrow.selector);
        auction.commitBid(id, RESERVE - 1, commitment, _validProof());
        vm.stopPrank();
    }

    function testDoubleCommitReverts() public {
        uint256 id = _createDefaultAuction();
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE * 2);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.expectRevert(SealedBidAuction.AlreadyCommitted.selector);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                               TIMING
    //////////////////////////////////////////////////////////////*/

    function testCommitRevertsAfterDeadline() public {
        uint256 id = _createDefaultAuction();
        vm.warp(block.timestamp + COMMIT_DURATION + 1);

        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));
        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        vm.expectRevert(SealedBidAuction.InvalidState.selector);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();
    }

    function testRevealRevertsBeforeCommitDeadline() public {
        uint256 id = _createDefaultAuction();
        uint256 nonce = 42;
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, nonce));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.expectRevert(SealedBidAuction.InvalidState.selector);
        auction.revealBid(id, ALICE_BID, nonce);
        vm.stopPrank();
    }

    function testRevealRevertsAfterRevealDeadline() public {
        uint256 id = _createDefaultAuction();
        uint256 nonce = 42;
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, nonce));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();

        vm.warp(block.timestamp + COMMIT_DURATION + REVEAL_DURATION + 1);
        vm.prank(alice);
        vm.expectRevert(SealedBidAuction.InvalidState.selector);
        auction.revealBid(id, ALICE_BID, nonce);
    }

    function testSettleRevertsBeforeRevealDeadline() public {
        uint256 id = _createDefaultAuction();
        vm.expectRevert(SealedBidAuction.InvalidState.selector);
        auction.settle(id);
    }

    /*//////////////////////////////////////////////////////////////
                              REVEAL MISMATCH
    //////////////////////////////////////////////////////////////*/

    function testRevealRevertsOnWrongNonce() public {
        uint256 id = _createDefaultAuction();
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();

        vm.warp(block.timestamp + COMMIT_DURATION + 1);
        vm.prank(alice);
        vm.expectRevert(SealedBidAuction.BadReveal.selector);
        auction.revealBid(id, ALICE_BID, uint256(43));
    }

    function testRevealRevertsWhenBidOutOfRange() public {
        uint256 id = _createDefaultAuction();
        // Commit with a dishonest commitment that re-hashes to match an
        // out-of-range bid post-reveal. ZK proof is valid for (reserve, escrow)
        // but the plaintext bid submitted at reveal is outside the range.
        uint256 badBid = ESCROW_ALICE + 1;
        uint256 nonce = 7;
        bytes32 commitment = keccak256(abi.encode(badBid, nonce));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();

        vm.warp(block.timestamp + COMMIT_DURATION + 1);
        vm.prank(alice);
        vm.expectRevert(SealedBidAuction.BidOutOfRange.selector);
        auction.revealBid(id, badBid, nonce);
    }

    /*//////////////////////////////////////////////////////////////
                           SETTLEMENT VARIANTS
    //////////////////////////////////////////////////////////////*/

    function testSettleReturnsAssetWhenNoReveals() public {
        uint256 id = _createDefaultAuction();
        bytes32 commitment = keccak256(abi.encode(ALICE_BID, uint256(42)));

        vm.startPrank(alice);
        payment.approve(address(auction), ESCROW_ALICE);
        auction.commitBid(id, ESCROW_ALICE, commitment, _validProof());
        vm.stopPrank();

        // Skip reveal entirely.
        vm.warp(block.timestamp + COMMIT_DURATION + REVEAL_DURATION + 1);
        auction.settle(id);

        // Asset returns to seller; alice's escrow is still locked pending refund().
        assertEq(asset.balanceOf(seller), 100 ether); // original mint intact
        assertEq(asset.balanceOf(address(auction)), 0);
        assertEq(payment.balanceOf(address(auction)), ESCROW_ALICE);

        vm.prank(alice);
        auction.refund(id);
        assertEq(payment.balanceOf(alice), 1_000_000);
    }

    function testSettleCannotBeCalledTwice() public {
        uint256 id = _createDefaultAuction();
        vm.warp(block.timestamp + COMMIT_DURATION + REVEAL_DURATION + 1);
        auction.settle(id);
        vm.expectRevert(SealedBidAuction.AlreadyFinalized.selector);
        auction.settle(id);
    }

    function testLoserRefundsAfterSettle() public {
        uint256 id = _createDefaultAuction();

        // Alice commits + reveals 5000.
        {
            uint256 n = 42;
            bytes32 c = keccak256(abi.encode(ALICE_BID, n));
            vm.startPrank(alice);
            payment.approve(address(auction), ESCROW_ALICE);
            auction.commitBid(id, ESCROW_ALICE, c, _validProof());
            vm.stopPrank();
        }

        // Bob commits with the same proof (same reserve/escrow public inputs)
        // but a lower bid. The ZK statement is identical; what differs is the
        // plaintext bid he will later reveal.
        uint256 bobBid = 3_000;
        uint256 bobNonce = 99;
        {
            bytes32 c = keccak256(abi.encode(bobBid, bobNonce));
            vm.startPrank(bob);
            payment.approve(address(auction), ESCROW_ALICE);
            auction.commitBid(id, ESCROW_ALICE, c, _validProof());
            vm.stopPrank();
        }

        vm.warp(block.timestamp + COMMIT_DURATION + 1);

        vm.prank(alice);
        auction.revealBid(id, ALICE_BID, 42);
        vm.prank(bob);
        auction.revealBid(id, bobBid, bobNonce);

        vm.warp(block.timestamp + REVEAL_DURATION);
        auction.settle(id);

        // Alice wins.
        assertEq(asset.balanceOf(alice), 1 ether);
        assertEq(payment.balanceOf(seller), ALICE_BID);

        // Winner cannot refund; she's already been paid the escrow surplus.
        vm.prank(alice);
        vm.expectRevert(SealedBidAuction.NoRefund.selector);
        auction.refund(id);

        // Bob pulls his escrow.
        vm.prank(bob);
        auction.refund(id);
        assertEq(payment.balanceOf(bob), 1_000_000);
    }
}

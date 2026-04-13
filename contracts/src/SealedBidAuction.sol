// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solmate/tokens/ERC20.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";
import {IHonkVerifier} from "./interfaces/IHonkVerifier.sol";
import {IKycSBT} from "./interfaces/IKycSBT.sol";

/// @title Private sealed-bid auction for RWA on HashKey Chain.
/// @notice Bidders prove `reserve <= bid <= escrow` in zero-knowledge at commit
///         time, escrow the full collateral, and only reveal the bid after the
///         commit window closes. Solvency is proven without revealing the bid,
///         which is the load-bearing ZK property.
/// @dev    The range proof (reserve, escrow) is the ZK layer. The commitment
///         binding (commitment == keccak256(bid, nonce)) is verified on-chain
///         at reveal time with cheap keccak256. This keeps the circuit minimal.
contract SealedBidAuction {
    using SafeTransferLib for ERC20;

    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/

    enum Status {
        COMMIT,
        REVEAL,
        SETTLEMENT,
        FINALIZED
    }

    struct Auction {
        address seller;
        ERC20 asset;
        uint256 assetAmount;
        ERC20 paymentToken;
        uint256 reserve;
        uint64 commitDeadline;
        uint64 revealDeadline;
        Status status;
        address highestBidder;
        uint256 highestBid;
    }

    struct Commitment {
        uint256 escrow;
        bytes32 commitment;
        bool revealed;
        bool refunded;
    }

    /*//////////////////////////////////////////////////////////////
                              IMMUTABLES
    //////////////////////////////////////////////////////////////*/

    IHonkVerifier public immutable verifier;
    IKycSBT public immutable kycSbt;
    uint8 public immutable minKycLevel;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public auctionCount;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => Commitment)) public commitments;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event AuctionCreated(
        uint256 indexed id,
        address indexed seller,
        address indexed asset,
        uint256 assetAmount,
        address paymentToken,
        uint256 reserve,
        uint64 commitDeadline,
        uint64 revealDeadline
    );
    event BidCommitted(uint256 indexed id, address indexed bidder, uint256 escrow, bytes32 commitment);
    event BidRevealed(uint256 indexed id, address indexed bidder, uint256 bid);
    event AuctionSettled(uint256 indexed id, address indexed winner, uint256 winningBid);
    event Refunded(uint256 indexed id, address indexed bidder, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotKyc();
    error InvalidState();
    error InvalidDeadlines();
    error InvalidReserve();
    error InvalidEscrow();
    error InvalidProof();
    error AlreadyCommitted();
    error NoCommitment();
    error AlreadyRevealed();
    error BadReveal();
    error BidOutOfRange();
    error AlreadyFinalized();
    error NotWinner();
    error AlreadyRefunded();
    error NoRefund();

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(IHonkVerifier _verifier, IKycSBT _kycSbt, uint8 _minKycLevel) {
        verifier = _verifier;
        kycSbt = _kycSbt;
        minKycLevel = _minKycLevel;
    }

    /*//////////////////////////////////////////////////////////////
                            SELLER ACTIONS
    //////////////////////////////////////////////////////////////*/

    function createAuction(
        ERC20 asset,
        uint256 assetAmount,
        ERC20 paymentToken,
        uint256 reserve,
        uint64 commitDuration,
        uint64 revealDuration
    ) external returns (uint256 id) {
        if (assetAmount == 0) revert InvalidEscrow();
        if (reserve == 0) revert InvalidReserve();
        if (commitDuration == 0 || revealDuration == 0) revert InvalidDeadlines();

        id = ++auctionCount;
        uint64 commitDeadline = uint64(block.timestamp) + commitDuration;
        uint64 revealDeadline = commitDeadline + revealDuration;

        auctions[id] = Auction({
            seller: msg.sender,
            asset: asset,
            assetAmount: assetAmount,
            paymentToken: paymentToken,
            reserve: reserve,
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            status: Status.COMMIT,
            highestBidder: address(0),
            highestBid: 0
        });

        asset.safeTransferFrom(msg.sender, address(this), assetAmount);

        emit AuctionCreated(
            id, msg.sender, address(asset), assetAmount, address(paymentToken), reserve, commitDeadline, revealDeadline
        );
    }

    /*//////////////////////////////////////////////////////////////
                             BIDDER ACTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Commit to a bid. The proof is a Noir/UltraHonk ZK proof that
    ///         `reserve <= bid <= escrow`. The commitment is keccak256(bid, nonce)
    ///         and is verified against the plaintext bid at reveal time.
    function commitBid(uint256 id, uint256 escrow, bytes32 commitment, bytes calldata proof) external {
        Auction storage a = auctions[id];
        if (a.seller == address(0)) revert InvalidState();
        if (block.timestamp >= a.commitDeadline) revert InvalidState();
        if (escrow < a.reserve) revert InvalidEscrow();
        if (commitments[id][msg.sender].commitment != bytes32(0)) revert AlreadyCommitted();

        (bool ok, uint8 level) = kycSbt.isHuman(msg.sender);
        if (!ok || level < minKycLevel) revert NotKyc();

        bytes32[] memory publicInputs = new bytes32[](2);
        publicInputs[0] = bytes32(a.reserve);
        publicInputs[1] = bytes32(escrow);
        // The generated Honk verifier reverts on rejection instead of returning
        // false, so wrap the call and surface a single canonical error.
        try verifier.verify(proof, publicInputs) returns (bool verified) {
            if (!verified) revert InvalidProof();
        } catch {
            revert InvalidProof();
        }

        commitments[id][msg.sender] =
            Commitment({escrow: escrow, commitment: commitment, revealed: false, refunded: false});

        a.paymentToken.safeTransferFrom(msg.sender, address(this), escrow);

        emit BidCommitted(id, msg.sender, escrow, commitment);
    }

    /// @notice Reveal a previously committed bid. `nonce` must match what was
    ///         hashed into the commitment. Also re-asserts the range check
    ///         on-chain as defense-in-depth against a broken verifier.
    function revealBid(uint256 id, uint256 bid, uint256 nonce) external {
        Auction storage a = auctions[id];
        if (block.timestamp < a.commitDeadline || block.timestamp >= a.revealDeadline) {
            revert InvalidState();
        }

        Commitment storage c = commitments[id][msg.sender];
        if (c.commitment == bytes32(0)) revert NoCommitment();
        if (c.revealed) revert AlreadyRevealed();
        if (keccak256(abi.encode(bid, nonce)) != c.commitment) revert BadReveal();
        if (bid < a.reserve || bid > c.escrow) revert BidOutOfRange();

        c.revealed = true;

        if (bid > a.highestBid) {
            a.highestBid = bid;
            a.highestBidder = msg.sender;
        }

        emit BidRevealed(id, msg.sender, bid);
    }

    /*//////////////////////////////////////////////////////////////
                               SETTLEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Finalize the auction after reveal window closes. Anyone can call.
    ///         Winner pays `highestBid`, receives the asset, and is refunded any
    ///         escrow above the winning bid. Losers and no-shows pull via refund().
    function settle(uint256 id) external {
        Auction storage a = auctions[id];
        if (a.seller == address(0)) revert InvalidState();
        if (a.status == Status.FINALIZED) revert AlreadyFinalized();
        if (block.timestamp < a.revealDeadline) revert InvalidState();

        a.status = Status.FINALIZED;

        if (a.highestBidder == address(0)) {
            // No valid reveal — return asset to seller.
            a.asset.safeTransfer(a.seller, a.assetAmount);
            emit AuctionSettled(id, address(0), 0);
            return;
        }

        Commitment storage winnerCommit = commitments[id][a.highestBidder];
        uint256 winningBid = a.highestBid;
        uint256 refundToWinner = winnerCommit.escrow - winningBid;
        winnerCommit.refunded = true;

        a.asset.safeTransfer(a.highestBidder, a.assetAmount);
        a.paymentToken.safeTransfer(a.seller, winningBid);
        if (refundToWinner > 0) {
            a.paymentToken.safeTransfer(a.highestBidder, refundToWinner);
        }

        emit AuctionSettled(id, a.highestBidder, winningBid);
    }

    /// @notice Pull escrow back. Available to any bidder that is not the
    ///         winner once the auction is finalized, including bidders that
    ///         committed but never revealed.
    function refund(uint256 id) external {
        Auction storage a = auctions[id];
        if (a.status != Status.FINALIZED) revert InvalidState();

        Commitment storage c = commitments[id][msg.sender];
        if (c.commitment == bytes32(0)) revert NoCommitment();
        if (msg.sender == a.highestBidder) revert NoRefund();
        if (c.refunded) revert AlreadyRefunded();

        c.refunded = true;
        uint256 amount = c.escrow;
        a.paymentToken.safeTransfer(msg.sender, amount);

        emit Refunded(id, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                                 VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @notice Returns the status derived from the current block timestamp.
    ///         Storage status only flips on settle(); this helper reflects the
    ///         timeline without touching state.
    function currentStatus(uint256 id) external view returns (Status) {
        Auction storage a = auctions[id];
        if (a.seller == address(0)) return Status.COMMIT;
        if (a.status == Status.FINALIZED) return Status.FINALIZED;
        if (block.timestamp < a.commitDeadline) return Status.COMMIT;
        if (block.timestamp < a.revealDeadline) return Status.REVEAL;
        return Status.SETTLEMENT;
    }
}

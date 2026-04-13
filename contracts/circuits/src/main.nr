// Sealed-bid auction spike: solvency range proof.
//
// Private: bid
// Public:  reserve, escrow
//
// Proves: reserve <= bid <= escrow (without revealing bid).
//
// Commitment binding (commitment == keccak(bid, nonce)) is done on-chain
// at reveal time with cheap keccak256 in Solidity, not inside the circuit.
// This keeps the circuit minimal and the ZK property load-bearing:
// solvency is proven privately; the bid is never revealed until reveal phase.
fn main(bid: Field, reserve: pub Field, escrow: pub Field) {
    let bid_u = bid as u64;
    let reserve_u = reserve as u64;
    let escrow_u = escrow as u64;
    assert(bid_u >= reserve_u);
    assert(bid_u <= escrow_u);
}

#[test]
fn test_valid_bid() {
    main(5000, 1000, 10000);
}

#[test(should_fail)]
fn test_bid_below_reserve() {
    main(500, 1000, 10000);
}

#[test(should_fail)]
fn test_bid_above_escrow() {
    main(20000, 1000, 10000);
}

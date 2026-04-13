import SealedBidAuction from "./SealedBidAuction.json";
import HonkVerifier from "./HonkVerifier.json";
import MockKycSBT from "./MockKycSBT.json";
import MockERC20 from "./MockERC20.json";

// viem's `abi` parameter wants a narrow-tuple type for full typesafety.
// Using `as const` makes the exported arrays literal tuples so viem can
// derive function names and return shapes automatically.
export const auctionAbi = SealedBidAuction as unknown as readonly unknown[];
export const verifierAbi = HonkVerifier as unknown as readonly unknown[];
export const kycSbtAbi = MockKycSBT as unknown as readonly unknown[];
export const erc20Abi = MockERC20 as unknown as readonly unknown[];

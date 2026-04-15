# SealedHash — Private Sealed-Bid Auctions on HashKey Chain

> **HashKey Chain Horizon Hackathon submission — ZKID track.**
> **Repository:** [github.com/IronicDeGawd/Haskkey-SealedHash](https://github.com/IronicDeGawd/Haskkey-SealedHash)
> **Network:** HashKey Chain Testnet (chainId 133)
> **Live auction contract:** [`0x15dd37d92eD9526300FE5de5aB555AeA6C621f22`](https://testnet-explorer.hsk.xyz/address/0x15dd37d92eD9526300FE5de5aB555AeA6C621f22)

## One-liner

A sealed-bid auction for tokenized real-world assets where **bidders prove in zero knowledge that `reserve ≤ bid ≤ escrow` before the bid ever leaves the browser**. Solvency is verifiable on-chain; the bid itself stays hidden until the reveal window. Commit-reveal alone cannot prove solvency without disclosure — this is the property that makes the ZK load-bearing, not decorative.

## What problem it solves

Traditional on-chain auctions leak every bid the moment it hits the mempool, letting MEV bots front-run and competing bidders collude. Plain commit-reveal hides the value but cannot prove a bidder actually has enough collateral to back their bid until the reveal — by which point a bad actor has already wasted everyone's time. SealedHash combines **on-chain commit-reveal** with a **Noir range-proof circuit** so each bidder escrows funds, proves `reserve ≤ bid ≤ escrow` without revealing `bid`, and the contract can safely accept the commitment knowing the bid is already collateralized. The seller gets true sealed-bid semantics with zero disclosure risk and zero insolvent bids.

## How it works (30 seconds)

1. **Commit.** Bidder generates a Noir proof in-browser that `reserve ≤ bid ≤ escrow`, locks `escrow` tokens into the auction contract, and submits `commitment = keccak256(bid, nonce)` alongside the proof. KYC SBT is checked before the commit is accepted.
2. **Reveal.** After the commit window closes, the bidder reveals `(bid, nonce)`. The contract recomputes the hash and re-asserts the range on-chain as defence-in-depth.
3. **Settle.** Anyone can call `settle()` after the reveal window. Asset goes to the highest revealed bidder, winning bid goes to the seller, escrow surplus is refunded atomically. Non-winners pull their refunds via `refund()`.

## Why this is load-bearing ZK, not "ZK in name"

The range proof is the only reason this design beats plain commit-reveal. Without ZK, you cannot prove `bid ≤ escrow` without revealing the bid. Commitment binding uses plain `keccak256(bid, nonce)` on-chain at reveal time — the circuit stays minimal and the ZK property is exactly **"solvency without disclosure,"** which no non-ZK scheme can match.

## Highlights

- **Full Noir 1.0.0-beta.19 → UltraHonk → Solidity verifier pipeline**, auto-generated, transparent (no trusted setup).
- **Browser-side proving** via `@aztec/bb.js 4.1.1` in Next.js 16 / React 19. Cold proof 18.8s, warm ~1.5s, 7232-byte proof.
- **KYC-gated** via `IKycSBT` — MockKycSBT for demo, live HashKey testnet SBT at `0xA45f42F09A7Ae50e556467cf65cF3Cf45711114E` wire-compatible (single env flip).
- **16/16 Foundry tests passing** against a real on-chain proof fixture — not mocks.
- **EIP-170-compliant verifier**: runtime bytecode squeezed to **24,252 bytes** (324 bytes under the 24,576 limit).
- **Every state path verified live on HashKey testnet**: create → commit → reveal → settle, plus no-commit, no-reveal, and refund edge cases.
- **Off-chain v2 backend (post-submission)** — SIWE auth, HKDF-AES-GCM encrypted nonce backup derived from wallet signatures, Drizzle/Postgres indexer — so users cannot lose bids to a cleared localStorage while plaintext still never leaves the browser.

## Stack

| Layer | Pick |
|---|---|
| ZK circuit | Noir `1.0.0-beta.19` (range check via `u64` cast) |
| Prover | Barretenberg `bb 4.1.1`, UltraHonk, transparent (no trusted setup) |
| On-chain verifier | `HonkVerifier` auto-generated via `bb write_solidity_verifier --verifier_target evm` |
| Smart contracts | Foundry, Solc 0.8.28, solmate ERC20 |
| KYC | `IKycSBT` — MockKycSBT for demo, live HashKey testnet SBT available via one env var flip |
| Browser proving | `@aztec/bb.js 4.1.1` + `@noir-lang/noir_js 1.0.0-beta.19` in Next.js 16 + React 19 |
| Chain client | viem |
| Chain | HashKey Chain Testnet (chainId 133, RPC `https://testnet.hsk.xyz`) |

## Deployed contracts (HashKey Testnet, chainId 133)

| Contract | Address |
|---|---|
| HonkVerifier | [`0x9E0830b0D6f180e2Eaf8E14956386383d855cEd7`](https://testnet-explorer.hsk.xyz/address/0x9E0830b0D6f180e2Eaf8E14956386383d855cEd7) |
| MockKycSBT | [`0x53e1F063166AbFbc7C387839BA439b1bb974E319`](https://testnet-explorer.hsk.xyz/address/0x53e1F063166AbFbc7C387839BA439b1bb974E319) |
| SealedBidAuction | [`0x15dd37d92eD9526300FE5de5aB555AeA6C621f22`](https://testnet-explorer.hsk.xyz/address/0x15dd37d92eD9526300FE5de5aB555AeA6C621f22) |
| Mock RWA (mRWA, 18 dec) | [`0x6d4b1af928CBE669659521B5DEA37961B37ACCe9`](https://testnet-explorer.hsk.xyz/address/0x6d4b1af928CBE669659521B5DEA37961B37ACCe9) |
| Mock USDT (mUSDT, 6 dec) | [`0xAfc441e6baf4518f38159AecBd0Eed6EDd083198`](https://testnet-explorer.hsk.xyz/address/0xAfc441e6baf4518f38159AecBd0Eed6EDd083198) |

Live HashKey testnet KYC SBT at `0xA45f42F09A7Ae50e556467cf65cF3Cf45711114E` is known and the interface matches `IKycSBT.isHuman` exactly. The user-facing on-ramp `hunyuankyc.com` returned DNS failure during integration, so production KYC was deferred. Wiring is a single env var change.

## Flow

```
createAuction
    |
    v
COMMIT  ---- commitBid(escrow, keccak256(bid,nonce), zkProof)
    |          where zkProof proves reserve <= bid <= escrow
    |          without revealing bid; escrow is transferFrom'd
    v
REVEAL  ---- revealBid(bid, nonce)
    |          contract verifies keccak and re-asserts the range
    v
SETTLEMENT -- settle()          (anyone can call)
    |          asset -> highestBidder (or seller if no reveals)
    |          winning bid -> seller
    |          escrow surplus -> winner atomically
    v
FINALIZED -- refund()           (pull-pattern for losers)
```

## Tests — what was run, on what, and the result

### Contract tests — Foundry, 16/16 passing

Run with `cd contracts && forge test`. All against the compiled `HonkVerifier` + a real proof fixture at `contracts/test/fixtures/valid-proof.bin` (bid=5000 reserve=1000 escrow=10000).

| # | Test | Coverage |
|---|---|---|
| 1 | `testCreateAuctionEscrowsAsset` | seller path: asset pulled into escrow |
| 2 | `testCommitRevealSettleHappyPath` | full round trip with real ZK proof |
| 3 | `testCommitRevertsWhenBidderNotKyc` | KYC gate when `isHuman` is false |
| 4 | `testCommitRevertsWhenKycLevelTooLow` | KYC gate when level below minimum |
| 5 | `testCommitRevertsOnEscrowMismatchWithProof` | verifier rejection when escrow public input ≠ proof |
| 6 | `testCommitRevertsWhenEscrowBelowReserve` | early revert before verifier |
| 7 | `testDoubleCommitReverts` | one commitment per bidder per auction |
| 8 | `testCommitRevertsAfterDeadline` | commit deadline enforcement |
| 9 | `testRevealRevertsBeforeCommitDeadline` | reveal window opens only after commit window |
| 10 | `testRevealRevertsAfterRevealDeadline` | reveal deadline enforcement |
| 11 | `testSettleRevertsBeforeRevealDeadline` | settle gate |
| 12 | `testRevealRevertsOnWrongNonce` | keccak commitment mismatch |
| 13 | `testRevealRevertsWhenBidOutOfRange` | defense-in-depth range recheck on-chain |
| 14 | `testSettleReturnsAssetWhenNoReveals` | no-reveal path returns asset to seller |
| 15 | `testSettleCannotBeCalledTwice` | idempotency |
| 16 | `testLoserRefundsAfterSettle` | pull-pattern refund for non-winners |

### Browser ZK proving — Playwright headless

| Scenario | Measurement |
|---|---|
| Cold proof (WASM + SRS first run) | 18.8s, 7232-byte proof |
| Warm proof (subsequent runs) | ~1.5s |
| Public inputs | `[reserve, escrow]` — byte-identical to the node.js spike |

### End-to-end on HashKey Testnet — real on-chain transactions

Verified via Playwright headless + `cast call` round-trips.

| Auction | Scenario tested | Outcome |
|---|---|---|
| #1 | commit (nonce lost mid-session) | committed, became a stuck-no-reveal fixture |
| #2 | 6h commit / 6h reveal window | seeded for manual walkthrough |
| #3 | tight commit window exceeded during broadcast | became a no-commit settlement fixture |
| #4 | **full commit → wait → reveal cycle** | `highestBid = 5000`, `revealed = true`, on-chain |
| #5 | **commit → skip reveal → settle → refund** | `FINALIZED`, `highestBidder = 0x0`, asset returned to seller, escrow refunded |

Cross-checked with `cast call`:

```
commitments(4, deployer) = (10000, 0x7ba5332d..., true, false)   // revealed
auctions(4).highestBidder = deployer, highestBid = 5000

commitments(5, deployer) = (10000, 0xfa25e069..., false, true)   // refunded
auction mUSDT balance: 30000 -> 20000 (escrow returned)
```

### Contract size — EIP-170 boundary

`HonkVerifier` runtime bytecode is **24,252 bytes**, 324 bytes under the 24,576 EIP-170 limit. Achieved by dropping `optimizer_runs` to `1`. Any future circuit change that grows the bytecode past 24,576 will break the deploy — run `forge inspect HonkVerifier deployedBytecode` and divide by 2 to monitor.

### Frontend — Next.js build + Playwright sweep

Post-remold verification. Run with `cd frontend && npm run build` for the static gate and an MCP Playwright browser driver for the interactive sweep.

| Surface | Checks | Result |
|---|---|---|
| `npm run build` | TypeScript strict, Next.js 16 App Router, 15 routes (5 static, 4 API, 6 dynamic / SSR) | clean, no type or font errors |
| `/` (landing) | hero renders, tech-strip marquee animation key `sh-marquee 28s linear infinite`, 6 feature cards with hover lift, accordion opens | ✅ |
| `/how-it-works` | long-form article, envelope SVG, 4 numbered phase blocks, comparison grid, related links | ✅ |
| `/auctions` (filters) | 5 filter pills render with live counts, clicking "Finalized" collapses card grid from 5 → 1 | ✅ |
| `/auctions/[id]` (detail) | summary + your-position + ink actions block, status pill reflects on-chain phase | ✅ |
| `/auctions/[id]/mybid` | commitment card with full hash display, reveal/refund branches | ✅ |
| `/create`, `/dev` | form + hints layout, dev ZK smoke test generates a real proof end-to-end | ✅ |
| Route transition | `<PageTransition />` mounts 3 blocks at z-80 on `usePathname` change | ✅ |
| Test-signer bridge canary | `/dev` proof generator runs via `@aztec/bb.js` WebAssembly, output JSON populates, verifies COOP/COEP still intact | ✅ |
| Responsive sweep | 1440px desktop + 1920px wide + 375px mobile, no horizontal overflow, footer reaches viewport bottom | ✅ |

## Security review

Three separate review passes are on record. All findings are documented here; none block deployment.

### Pass 1 — contract surface (Foundry)

The contract test suite is the first line of defence. All 16 tests hit the real on-chain verifier and a real proof fixture — no mocks. The suite was designed to hit each known failure mode:

- **Reentrancy**: commit / reveal / settle / refund are single-state-transition paths with effects written before external calls. `settle()` writes `FINALIZED` before the payout loop.
- **KYC gate bypass**: tests 3 + 4 assert the `IKycSBT.isHuman` check rejects non-KYC and sub-level addresses at commit time, not reveal time.
- **Verifier bypass**: test 5 proves the verifier rejects when the escrow public input doesn't match the proof's bound value. The circuit's public inputs are `[reserve, escrow]` and both are re-bound in Solidity.
- **Commit / reveal deadline races**: tests 8 + 9 + 10 + 11 assert every state transition enforces its deadline strictly.
- **Nonce reuse / double commit**: test 7 asserts one commitment per bidder per auction.
- **Defence-in-depth range recheck**: test 13 asserts the contract re-asserts `reserve ≤ bid ≤ escrow` at reveal time, so a compromised circuit cannot break the invariant.
- **Refund pull-pattern idempotency**: test 15 + 16 assert `settle()` can only be called once and losers can refund exactly once.

**Finding**: The `MockKycSBT` used in tests permits self-KYC. The live HashKey testnet SBT at `0xA45f42F09A7Ae50e556467cf65cF3Cf45711114E` is interface-compatible, and the wire is a single env flip. Production deployment MUST NOT ship `MockKycSBT`.

### Pass 2 — frontend remold diff (2026-04-15)

Targeted audit of the 38-file, 4230-insertion `frontend-design` diff before merging to `main`. The goal was to verify the UI remold did not introduce any injection, secret leakage, or unsafe DOM operations, and did not disturb the frozen contract boundaries.

| Category | Check | Result |
|---|---|---|
| XSS / unsafe HTML | `dangerouslySetInnerHTML`, `innerHTML =`, `document.write` | zero occurrences in diff |
| Code injection | `eval(`, `new Function(`, string `setTimeout` / `setInterval` | zero occurrences |
| Dangerous URLs | `javascript:`, `data:text/html` in any href | zero occurrences |
| External links | all 10 `target="_blank"` anchors use `rel="noreferrer"` (implies noopener in modern browsers) | ✅ |
| Secrets / env leaks | grep for `process.env` in new components/pages | zero reads outside `lib/chain.ts` + `lib/addresses.ts` (unchanged) |
| Frozen boundaries | `lib/auction`, `lib/erc20`, `lib/kyc`, `lib/commitment`, `lib/prove`, `lib/chain`, `lib/wallet-context`, `lib/addresses`, `lib/db/*`, `lib/crypto/*`, `next.config.ts`, `contracts/`, `circuits/`, `/api/*`, `scripts/indexer.ts` | zero changes — all intact |
| Storage key | `hashkey-sealed-bid-v1` in `lib/commitment.ts` | intact |
| COOP / COEP headers | `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` in `next.config.ts` | intact, verified by cold proof canary at `/dev` |
| Test-signer bridge gates | `NEXT_PUBLIC_TEST_PRIVATE_KEY` + `NODE_ENV !== "production"` + no `window.ethereum` in `lib/chain.ts` | intact |

**Informational findings** (not blocking):

1. `/how-it-works` article copy documents `NEXT_PUBLIC_TEST_PRIVATE_KEY` as a setup instruction. This reveals the bridge path name but not any secret. The bridge is already compile-time stripped in production builds. If shipping to production, rename to `TEST_PRIVATE_KEY` (non-`NEXT_PUBLIC_`) and drop the doc line.
2. All `target="_blank"` links use `rel="noreferrer"` but not explicit `noopener`. `noreferrer` implies `noopener` in every browser shipping today, so this is portable; `rel="noreferrer noopener"` would be maximally explicit.

### Pass 3 — dependency / supply chain

- `npm audit` with `--omit=dev` (production-only): **0 vulnerabilities** across `info`, `low`, `moderate`, `high`, `critical`.
- `npm audit` (full): **4 moderate** — all in `drizzle-kit`'s bundled `esbuild` dev CLI (GHSA-67mh-4wv8-2f99). This is a dev-server-only issue; the `drizzle-kit` CLI is never invoked in production runtime and `esbuild` is never shipped in the Next.js bundle. **Not exploitable in our deployment.**
- `motion@12.38.0` — official `motiondivision/motion` package (MIT, Matt Perry's team, same repo as `framer-motion`). Depends on `framer-motion@^12.38.0` + `tslib`. Supply chain provenance verified.
- No new `package.json` dependencies beyond `motion`, `tailwindcss@4`, `@tailwindcss/postcss@4`, `postcss@8`. All are well-maintained upstream packages.

## Repository layout

```
contracts/                          Foundry workspace
    src/
        SealedBidAuction.sol        state machine: createAuction, commitBid, revealBid, settle, refund
        Verifier.sol                auto-generated UltraHonk verifier
        interfaces/                 IHonkVerifier, IKycSBT
        mocks/                      MockKycSBT, MockERC20
    circuits/                       Noir workspace
        src/main.nr                 range proof: assert(reserve <= bid as u64 <= escrow)
        build.sh                    nargo compile + bb write_vk + bb write_solidity_verifier
    script/                         Deploy, DeployMockAssets, SeedDemoAuction
    test/                           16 Foundry tests + fixtures/valid-proof.bin
    js/                             parameterized proof generator
frontend/                           Next.js 16 + React 19
    app/
        page.tsx                    landing
        auctions/page.tsx           list
        auctions/[id]/page.tsx      auction detail (commit / reveal-link / settle / finalized)
        auctions/[id]/mybid/        bidder's private view (reveal / refund)
        create/page.tsx             seller flow
        dev/page.tsx                mint, self-kyc, zk smoke-test
    components/
        WalletButton.tsx            wallet connect + chain gate
        CommitForm.tsx              kyc + approve + ZK proof + commitBid in one click
        RevealForm.tsx              localStorage-backed reveal
        SettleButton.tsx            anyone-can-call settle
        RefundButton.tsx            pull-pattern refund
        TestSignerBanner.tsx        yellow warning when dev test-signer is active
    lib/
        chain.ts                    viem clients, wallet glue, dev-only test signer bridge
        addresses.ts                deployed contract addresses
        auction.ts                  read + write wrappers for SealedBidAuction
        erc20.ts                    read + write wrappers for MockERC20
        kyc.ts                      read + write wrappers for MockKycSBT
        commitment.ts               keccak256 commitment + localStorage nonce persistence
        prove.ts                    browser-side UltraHonk proof generation
        wallet-context.tsx          React context for wallet session state
        abis/                       exported contract ABIs (generated)
scripts/export-abis.mjs             contracts/out -> frontend/lib/abis
```

## Run locally

```
# Prereqs
noirup -v 1.0.0-beta.19
bbup -v 4.1.1
foundryup

# Contracts
cd contracts
forge install
(cd circuits && ./build.sh)          # regenerate verifier from circuit
forge test                            # 16/16 expected

# Deploy to your own testnet address
cp .env.example .env
# edit .env with your PRIVATE_KEY
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://testnet.hsk.xyz --broadcast
forge script script/DeployMockAssets.s.sol:DeployMockAssetsScript \
    --rpc-url https://testnet.hsk.xyz --broadcast
# copy the logged addresses back into .env
forge script script/SeedDemoAuction.s.sol:SeedDemoAuctionScript \
    --rpc-url https://testnet.hsk.xyz --broadcast

# Frontend (points at the already-deployed testnet addresses by default)
cd ../frontend
npm install
npm run dev                           # http://localhost:3000
```

## Design decisions worth knowing

- **Poseidon2 is NOT inside the circuit.** The external `noir-lang/poseidon` crate (v0.3.0) is incompatible with `nargo 1.0.0-beta.19` at the `poseidon2_permutation` arity, and the stdlib Poseidon2 is `pub(crate)`. Commitment binding is `keccak256(abi.encode(bid, nonce))` verified on-chain at reveal time. The circuit stays minimal; ZK still carries the load-bearing solvency property.
- **`--verifier_target evm`** is the current `bb` flag for both `write_vk` and `write_solidity_verifier`. Older docs say `--oracle_hash keccak` — that is deprecated.
- **`optimizer_runs = 1`** is a deliberate choice for the contracts workspace. `via_ir = true` trips "stack too deep" in the generated verifier's assembly, so the only remaining knob to shrink runtime bytecode under EIP-170 was to drop runs.
- **`@aztec/bb.js` WASM requires `SharedArrayBuffer`**, which requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. Set in `frontend/next.config.ts`. Without these the prover silently hangs.
- **The dev test-signer bridge** (`lib/chain.ts`) gates on three conditions: `NEXT_PUBLIC_TEST_PRIVATE_KEY` set, `NODE_ENV !== "production"`, and no injected wallet. It lets Playwright sign txs end-to-end. Production builds strip the path at compile time.
- **localStorage is the reveal nonce store.** A cleared-storage recovery path (manual bid + nonce entry) is built into `RevealForm`. Production would use a passkey-encrypted backup.

## What is out of scope

- Multi-round / Dutch / English auction variants
- Cross-chain bidding
- Subgraph / event indexer
- Mobile responsive layout
- Production KYC integration (code-ready, blocked on hunyuankyc.com being reachable)
- Mainnet deployment

## Links

- **Source:** [github.com/IronicDeGawd/Haskkey-SealedHash](https://github.com/IronicDeGawd/Haskkey-SealedHash)
- **Live auction contract:** [testnet-explorer.hsk.xyz/address/0x15dd37d92eD9526300FE5de5aB555AeA6C621f22](https://testnet-explorer.hsk.xyz/address/0x15dd37d92eD9526300FE5de5aB555AeA6C621f22)
- **HashKey Chain Horizon Hackathon:** [dorahacks.io/hackathon/2045](https://dorahacks.io/hackathon/2045)

## License

MIT.

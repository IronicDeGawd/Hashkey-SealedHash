#!/usr/bin/env node
// Extracts ABIs from contracts/out into frontend/lib/abis. Run after
// `forge build` whenever a contract changes. Keeps the frontend decoupled
// from the Foundry build output directory.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "contracts", "out");
const destDir = path.join(root, "frontend", "lib", "abis");

const mapping = {
  SealedBidAuction: "SealedBidAuction.sol/SealedBidAuction.json",
  HonkVerifier: "Verifier.sol/HonkVerifier.json",
  MockKycSBT: "MockKycSBT.sol/MockKycSBT.json",
  MockERC20: "MockERC20.sol/MockERC20.json",
};

fs.mkdirSync(destDir, { recursive: true });

for (const [name, rel] of Object.entries(mapping)) {
  const artifactPath = path.join(outDir, rel);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const destPath = path.join(destDir, `${name}.json`);
  fs.writeFileSync(destPath, JSON.stringify(artifact.abi, null, 2) + "\n");
  console.log(`${name.padEnd(18)} -> ${destPath} (${artifact.abi.length} entries)`);
}

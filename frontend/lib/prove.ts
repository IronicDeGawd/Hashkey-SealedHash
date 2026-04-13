"use client";

import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import circuit from "./noir_solidity.json";

export type ProofInputs = {
  bid: bigint;
  reserve: bigint;
  escrow: bigint;
};

export type ProofResult = {
  proof: Uint8Array;
  publicInputs: string[];
  witnessLength: number;
};

export async function generateAuctionProof(inputs: ProofInputs): Promise<ProofResult> {
  const api = await Barretenberg.new({ threads: 1 });
  const noir = new Noir(circuit as any);
  const honk = new UltraHonkBackend((circuit as any).bytecode, api);

  const { witness } = await noir.execute({
    bid: inputs.bid.toString(),
    reserve: inputs.reserve.toString(),
    escrow: inputs.escrow.toString(),
  });

  const { proof, publicInputs } = await honk.generateProof(witness, { verifierTarget: "evm" });

  return { proof, publicInputs, witnessLength: witness.length };
}

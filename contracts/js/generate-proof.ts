import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import fs from "fs";
import path from "path";
import circuit from "../circuits/target/noir_solidity.json" with { type: "json" };

function parseFlag(name: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : fallback;
}

(async () => {
  try {
    const bid = BigInt(parseFlag("bid", "5000"));
    const reserve = BigInt(parseFlag("reserve", "1000"));
    const escrow = BigInt(parseFlag("escrow", "10000"));
    const outDir = parseFlag("out", path.resolve("../circuits/target"));
    const tag = parseFlag("tag", "");

    fs.mkdirSync(outDir, { recursive: true });

    const api = await Barretenberg.new({ threads: 1 });
    const noir = new Noir(circuit as any);
    const honk = new UltraHonkBackend((circuit as any).bytecode, api);

    const inputs = { bid: bid.toString(), reserve: reserve.toString(), escrow: escrow.toString() };
    const { witness } = await noir.execute(inputs);
    const { proof, publicInputs } = await honk.generateProof(witness, { verifierTarget: "evm" });

    const suffix = tag ? `-${tag}` : "";
    fs.writeFileSync(path.join(outDir, `proof${suffix}`), proof);
    fs.writeFileSync(
      path.join(outDir, `public-inputs${suffix}.json`),
      JSON.stringify(publicInputs, null, 2),
    );

    console.log(
      `Proof generated (bid=${bid}, reserve=${reserve}, escrow=${escrow}) -> ${outDir}/proof${suffix}`,
    );
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

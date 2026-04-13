"use client";

import { useState } from "react";
import { generateAuctionProof } from "@/lib/prove";

export default function Home() {
  const [bid, setBid] = useState("5000");
  const [reserve, setReserve] = useState("1000");
  const [escrow, setEscrow] = useState("10000");
  const [status, setStatus] = useState("idle");
  const [output, setOutput] = useState<string>("");

  async function onRun() {
    setStatus("proving");
    setOutput("");
    const t0 = performance.now();
    try {
      const result = await generateAuctionProof({
        bid: BigInt(bid),
        reserve: BigInt(reserve),
        escrow: BigInt(escrow),
      });
      const t1 = performance.now();
      setOutput(
        JSON.stringify(
          {
            elapsedMs: Math.round(t1 - t0),
            proofBytes: result.proof.length,
            publicInputs: result.publicInputs,
            witnessLength: result.witnessLength,
            proofHex: "0x" + Array.from(result.proof.slice(0, 32)).map((b) => b.toString(16).padStart(2, "0")).join("") + "...",
          },
          null,
          2,
        ),
      );
      setStatus("ok");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setOutput(message);
      setStatus("error");
    }
  }

  return (
    <main style={{ fontFamily: "monospace", padding: 24, maxWidth: 720 }}>
      <h1>Sealed-bid auction - proof smoke-test</h1>
      <p>
        Runs the Noir range-proof circuit in the browser via @aztec/bb.js + @noir-lang/noir_js.
        Circuit: <code>reserve &lt;= bid &lt;= escrow</code>. Bid is private; reserve and escrow are public.
      </p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <label>
          bid (private):{" "}
          <input value={bid} onChange={(e) => setBid(e.target.value)} style={{ width: 120 }} />
        </label>
        <label>
          reserve (public):{" "}
          <input value={reserve} onChange={(e) => setReserve(e.target.value)} style={{ width: 120 }} />
        </label>
        <label>
          escrow (public):{" "}
          <input value={escrow} onChange={(e) => setEscrow(e.target.value)} style={{ width: 120 }} />
        </label>
        <button onClick={onRun} disabled={status === "proving"} style={{ width: 160, marginTop: 8 }}>
          {status === "proving" ? "proving..." : "generate proof"}
        </button>
      </div>
      <p>status: {status}</p>
      <pre style={{ background: "#f0f0f0", padding: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>
        {output}
      </pre>
    </main>
  );
}

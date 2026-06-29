"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, ShieldCheck } from "lucide-react";
import { decryptJson, type EncryptedPackage, importRawKey } from "@/lib/crypto/encrypt";
import { sha256Hex } from "@/lib/crypto/hash";
import { reconstructPackageKey, type GuardianShare } from "@/lib/crypto/shamir";
import { readJsonFile } from "@/lib/storage/file-artifacts";
import { usePlanStore } from "@/lib/storage/plan-store";

export function ReconstructDrill() {
  const plan = usePlanStore((state) => state.plan);
  const storedEncryptedPackage = usePlanStore((state) => state.encryptedPackage);
  const storedShares = usePlanStore((state) => state.shares);
  const setPlan = usePlanStore((state) => state.setPlan);
  const [importedPackage, setImportedPackage] = useState<EncryptedPackage | null>(null);
  const activePackage = importedPackage ?? storedEncryptedPackage;
  const [shareOne, setShareOne] = useState(storedShares[0] ? JSON.stringify(storedShares[0], null, 2) : "");
  const [shareTwo, setShareTwo] = useState(storedShares[1] ? JSON.stringify(storedShares[1], null, 2) : "");
  const [result, setResult] = useState<{ verified: boolean; packageBody: unknown; hash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importPackage(file: File | undefined) {
    if (!file) {
      return;
    }
    setImportedPackage(await readJsonFile<EncryptedPackage>(file));
  }

  async function importShare(file: File | undefined, target: "one" | "two") {
    if (!file) {
      return;
    }
    const share = await readJsonFile<GuardianShare>(file);
    const value = JSON.stringify(share, null, 2);
    if (target === "one") {
      setShareOne(value);
    } else {
      setShareTwo(value);
    }
  }

  async function runDrill() {
    setError(null);
    setResult(null);

    try {
      if (!activePackage) {
        throw new Error("Import or generate an encrypted package first.");
      }

      const selectedShares = [parseShareInput(shareOne, activePackage), parseShareInput(shareTwo, activePackage)];
      const key = await importRawKey(reconstructPackageKey(selectedShares, 2));
      const packageBody = await decryptJson<unknown>(activePackage, key);
      const hash = `sha256:${await sha256Hex(JSON.stringify(packageBody))}`;
      const verified = hash === activePackage.hash;
      setResult({ verified, packageBody, hash });
      if (verified && plan) {
        setPlan({ ...plan, status: "drill_complete" });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown reconstruction error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
        <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">Reconstruction drill</p>
          <h2 className="mt-1 text-xl font-semibold">Import package and combine two shares</h2>
        </div>
        <form className="space-y-4 p-5">
          <div className="border-2 border-warning bg-[#fff7da] p-4 text-sm leading-6 text-ink">
            Share files are imported locally. Do not paste or import real production seed material into this MVP.
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Encrypted package JSON
            <input className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm" type="file" accept="application/json,.json" onChange={(event) => importPackage(event.target.files?.[0])} />
            <span className="hash-text font-mono text-xs text-ink/55">{activePackage ? activePackage.hash : "No package imported. Local store package will be used if available."}</span>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Guardian share 1 JSON or raw share
            <input className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm" type="file" accept="application/json,.json" onChange={(event) => importShare(event.target.files?.[0], "one")} />
            <textarea className="memo-paper min-h-24 border-2 border-ink px-3 py-2 font-mono text-sm leading-7 shadow-[3px_3px_0_rgba(17,18,15,0.12)]" value={shareOne} onChange={(event) => setShareOne(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Guardian share 2 JSON or raw share
            <input className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm" type="file" accept="application/json,.json" onChange={(event) => importShare(event.target.files?.[0], "two")} />
            <textarea className="memo-paper min-h-24 border-2 border-ink px-3 py-2 font-mono text-sm leading-7 shadow-[3px_3px_0_rgba(17,18,15,0.12)]" value={shareTwo} onChange={(event) => setShareTwo(event.target.value)} />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d]" type="button" onClick={runDrill}>
              <ShieldCheck size={17} aria-hidden="true" />
              Run drill
            </button>
            {!activePackage ? (
              <Link className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-white px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink" href="/package">
                <FileUp size={17} aria-hidden="true" />
                Generate first
              </Link>
            ) : null}
          </div>
        </form>
      </section>
      <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
        <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">Verification result</p>
          <h2 className="mt-1 text-xl font-semibold">Package integrity</h2>
        </div>
        <div className="p-5">
          {error ? <p className="border-2 border-warning bg-[#fff7da] p-3 text-sm text-warning">{error}</p> : null}
          {result ? (
            <div className="space-y-4">
              <div className="border-2 border-ink bg-zcash p-5 shadow-[4px_4px_0_rgba(17,18,15,0.16)]">
                <ShieldCheck className="mb-3 size-7 text-guard" aria-hidden="true" />
                <p className="font-semibold">Hash verification {result.verified ? "passed" : "failed"}</p>
                <code className="hash-text mt-2 block text-sm">{result.hash}</code>
              </div>
              <pre className="memo-paper hash-text max-h-72 overflow-auto border-2 border-ink p-4 font-mono text-xs leading-6">{JSON.stringify(result.packageBody, null, 2)}</pre>
            </div>
          ) : (
            <div className="border-2 border-ink bg-zcash p-5 shadow-[4px_4px_0_rgba(17,18,15,0.16)]">
              <ShieldCheck className="mb-3 size-7 text-guard" aria-hidden="true" />
              <p className="font-semibold">Waiting for drill</p>
              <p className="mt-2 text-sm leading-6 text-ink/68">Decrypt the package and compare the decrypted hash with the original package hash.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function parseShareInput(input: string, encryptedPackage: EncryptedPackage): GuardianShare {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Both guardian shares are required");
  }
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as GuardianShare;
  }
  return {
    planId: encryptedPackage.planId,
    guardianId: "imported",
    shareIndex: Number(trimmed.split(":")[1]),
    share: trimmed,
    packageHash: encryptedPackage.hash
  };
}

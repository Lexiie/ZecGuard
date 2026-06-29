"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, Download, RotateCcw, ShieldAlert } from "lucide-react";
import { decryptJson, EncryptedPackage, encryptJson, exportRawKey, generatePackageKey, importRawKey } from "@/lib/crypto/encrypt";
import { sha256Hex } from "@/lib/crypto/hash";
import { GuardianShare, reconstructPackageKey, splitPackageKey } from "@/lib/crypto/shamir";
import { downloadJson, safeFilename } from "@/lib/storage/file-artifacts";
import { usePlanStore, type GuardianDraft } from "@/lib/storage/plan-store";
import { formatZecGuardMemo } from "@/lib/zcash/memo";

type DemoPackage = {
  planId: string;
  ownerAlias: string;
  walletType: string;
  recoveryInstructions: string;
  emergencyNote: string;
  dummySecret: string;
  createdAt: string;
};

type DrillResult = {
  planId: string;
  packageHash: string;
  encryptedPackage: EncryptedPackage;
  shares: GuardianShare[];
  inviteMemos: string[];
  ackMemos: string[];
  decryptedPackage: DemoPackage;
  verified: boolean;
};

const fallbackGuardians: GuardianDraft[] = [
  { id: "g1", name: "Guardian 1", address: "u1guardian1demo" },
  { id: "g2", name: "Guardian 2", address: "u1guardian2demo" },
  { id: "g3", name: "Guardian 3", address: "u1guardian3demo" }
].map((guardian) => ({ id: guardian.id, name: guardian.name, zcashAddress: guardian.address, status: "not_invited" }));

export function MvpWorkbench() {
  const plan = usePlanStore((state) => state.plan);
  const storedGuardians = usePlanStore((state) => state.guardians);
  const setPackageArtifacts = usePlanStore((state) => state.setPackageArtifacts);
  const upsertMemoRecord = usePlanStore((state) => state.upsertMemoRecord);
  const updateGuardian = usePlanStore((state) => state.updateGuardian);
  const [result, setResult] = useState<DrillResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const exportJson = useMemo(() => (result ? JSON.stringify(result.encryptedPackage, null, 2) : ""), [result]);

  async function runDrill() {
    setError(null);
    setIsRunning(true);

    try {
      const usableGuardians = storedGuardians.every((guardian) => guardian.zcashAddress.trim()) ? storedGuardians : fallbackGuardians;
      const planId = plan?.id ?? `zg_plan_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
      const packageBody: DemoPackage = {
        planId,
        ownerAlias: plan?.ownerAlias ?? "Owner",
        walletType: plan?.walletType ?? "Zashi",
        recoveryInstructions: plan?.recoveryInstructions ?? "Demo drill: combine any two guardian shares, decrypt the package, verify the package hash.",
        emergencyNote: plan?.emergencyNote ?? "Use dummy material only. Do not use this prototype for real recovery assets.",
        dummySecret: plan?.dummySecret ?? "dummy-zecguard-secret-never-a-real-seed",
        createdAt: plan?.createdAt ?? new Date().toISOString()
      };

      const canonicalPackageJson = JSON.stringify(packageBody);
      const packageHash = `sha256:${await sha256Hex(canonicalPackageJson)}`;
      const key = await generatePackageKey();
      const encryptedPackage = await encryptJson(planId, packageHash, packageBody, key);
      const keyBytes = await exportRawKey(key);
      const shares = splitPackageKey(keyBytes, {
        planId,
        packageHash,
        guardianIds: usableGuardians.map((guardian) => guardian.id),
        threshold: 2
      });

      const inviteMemos = usableGuardians.map((guardian) =>
        formatZecGuardMemo({
          type: "GUARDIAN_INVITE",
          plan_id: planId,
          guardian_id: guardian.id,
          threshold: "2-of-3",
          package_hash: packageHash,
          reply_to: "u1ownerDemoShieldedAddress",
          note: "Please confirm ZecGuard recovery readiness. No secret is in this memo."
        })
      );

      const ackMemos = usableGuardians.slice(0, 2).map((guardian) =>
        formatZecGuardMemo({
          type: "GUARDIAN_ACK",
          plan_id: planId,
          guardian_id: guardian.id,
          package_hash: packageHash,
          status: "received"
        })
      );

      const reconstructedKey = await importRawKey(reconstructPackageKey([shares[0], shares[1]], 2));
      const decryptedPackage = await decryptJson<DemoPackage>(encryptedPackage, reconstructedKey);
      const decryptedHash = `sha256:${await sha256Hex(JSON.stringify(decryptedPackage))}`;
      const verified = decryptedHash === packageHash;

      const drillResult = { planId, packageHash, encryptedPackage, shares, inviteMemos, ackMemos, decryptedPackage, verified };
      localStorage.setItem("zecguard:last-drill", JSON.stringify(drillResult));
      setPackageArtifacts({ encryptedPackage, shares, packageHash });
      inviteMemos.forEach((memo, index) => {
        const guardian = usableGuardians[index];
        upsertMemoRecord({
          id: `${planId}:${guardian.id}:invite`,
          planId,
          guardianId: guardian.id,
          type: "GUARDIAN_INVITE",
          memo,
          direction: "owner_to_guardian",
          status: "generated",
          createdAt: new Date().toISOString()
        });
        updateGuardian(guardian.id, { status: "invite_generated" });
      });
      ackMemos.forEach((memo, index) => {
        const guardian = usableGuardians[index];
        upsertMemoRecord({
          id: `${planId}:${guardian.id}:ack`,
          planId,
          guardianId: guardian.id,
          type: "GUARDIAN_ACK",
          memo,
          direction: "guardian_to_owner",
          status: "generated",
          createdAt: new Date().toISOString()
        });
        updateGuardian(guardian.id, { status: "ack_received" });
      });
      setResult(drillResult);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown drill error");
    } finally {
      setIsRunning(false);
    }
  }

  function resetDrill() {
    localStorage.removeItem("zecguard:last-drill");
    setResult(null);
    setError(null);
  }

  function exportPackage() {
    if (!result) {
      return;
    }
    downloadJson(`${safeFilename(result.planId)}-encrypted-package.json`, result.encryptedPackage);
  }

  function exportShare(share: GuardianShare) {
    downloadJson(`${safeFilename(share.planId)}-${safeFilename(share.guardianId)}-share.json`, share);
  }

  return (
    <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
      <div className="border-b-2 border-ink bg-zcash px-4 py-3 text-ink sm:px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Local MVP drill</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">Run the full recovery loop with dummy material</h2>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div className="border-2 border-warning bg-[#fff7da] p-4 text-sm leading-6 text-ink">
            <ShieldAlert className="mb-3 size-5 text-warning" aria-hidden="true" />
            This drill creates a package containing only a dummy secret. It never sends guardian shares through memos.
          </div>

          <div className="grid gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={runDrill}
              disabled={isRunning}
            >
              {isRunning ? "Running drill" : "Run MVP drill"}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-white px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink"
              type="button"
              onClick={resetDrill}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
          </div>

          {error ? <p className="border-2 border-warning bg-[#fff7da] p-3 text-sm text-warning">{error}</p> : null}

          {result ? (
            <div className="border-2 border-ink bg-paper p-4">
              <div className="mb-3 flex items-center gap-2 text-guard">
                <CheckCircle2 size={19} aria-hidden="true" />
                <p className="font-semibold">Hash verification {result.verified ? "passed" : "failed"}</p>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/55">Plan ID</p>
              <code className="hash-text mt-1 block text-sm">{result.planId}</code>
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-ink/55">Package hash</p>
              <code className="hash-text mt-1 block text-sm">{result.packageHash}</code>
              <button className="mt-4 inline-flex items-center gap-2 border-2 border-ink bg-zcash px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-ink" type="button" onClick={exportPackage}>
                <Download size={14} aria-hidden="true" />
                Download package
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {result ? (
            <>
              <Artifact title="Encrypted package JSON" value={exportJson} actionLabel="Copy package" />
              <div className="grid gap-3 md:grid-cols-3">
                {result.shares.map((share) => (
                  <Artifact key={share.guardianId} title={`Share ${share.shareIndex} / ${share.guardianId}`} value={JSON.stringify(share, null, 2)} actionLabel="Copy share" onDownload={() => exportShare(share)} compact />
                ))}
              </div>
              <Artifact title="Guardian invite memo" value={result.inviteMemos[0]} actionLabel="Copy invite" />
              <Artifact title="Guardian ACK memo" value={result.ackMemos[0]} actionLabel="Copy ACK" />
            </>
          ) : (
            <div className="memo-paper border-2 border-ink p-5 font-mono text-sm leading-7 text-ink/68">
              Run the drill to generate an encrypted package, 2-of-3 shares, ZECGUARD:v0 memos, ACK payloads, and a verified reconstruction result.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Artifact({ title, value, actionLabel = "Copy", onDownload, compact = false }: { title: string; value: string; actionLabel?: string; onDownload?: () => void; compact?: boolean }) {
  async function copyValue() {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="border-2 border-ink bg-paper shadow-[3px_3px_0_rgba(17,18,15,0.12)]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-rail px-3 py-2 text-paper">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zcash">{title}</p>
        <div className="flex items-center gap-3">
          {onDownload ? (
            <button className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/80 hover:text-zcash" type="button" onClick={onDownload}>
              <Download size={13} aria-hidden="true" />
              Download
            </button>
          ) : null}
          <button className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/80 hover:text-zcash" type="button" onClick={copyValue}>
            <Copy size={13} aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      </div>
      <pre className={`hash-text overflow-x-auto whitespace-pre-wrap p-3 font-mono text-xs leading-6 text-ink ${compact ? "max-h-32" : "max-h-72"}`}>{value}</pre>
    </div>
  );
}

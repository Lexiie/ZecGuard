"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Radio } from "lucide-react";
import { usePlanStore } from "@/lib/storage/plan-store";

type StoredDrill = {
  planId: string;
  packageHash: string;
  ackMemos: string[];
  shares: Array<{ guardianId: string }>;
  verified: boolean;
};

const fallbackGuardians = [
  ["Guardian 1", "ACK received", "ready"],
  ["Guardian 2", "ACK received", "ready"],
  ["Guardian 3", "ACK pending", "pending"]
] as const;

export function ReadinessDashboard() {
  const plan = usePlanStore((state) => state.plan);
  const storedGuardians = usePlanStore((state) => state.guardians);
  const encryptedPackage = usePlanStore((state) => state.encryptedPackage);
  const [drill, setDrill] = useState<StoredDrill | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("zecguard:last-drill");
    if (!stored) {
      return;
    }
    setDrill(JSON.parse(stored) as StoredDrill);
  }, []);

  const acknowledged = storedGuardians.filter((guardian) => guardian.status === "ack_received").length || drill?.ackMemos.length || 2;
  const guardians = encryptedPackage
    ? storedGuardians.map((guardian) => [guardian.name, statusLabel(guardian.status), guardian.status === "ack_received" ? "ready" : "pending"] as const)
    : drill
    ? drill.shares.map((share, index) => [share.guardianId, index < acknowledged ? "ACK received" : "ACK pending", index < acknowledged ? "ready" : "pending"] as const)
    : fallbackGuardians;

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_rgba(17,18,15,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/58">Plan</p>
          <p className="hash-text mt-1 font-semibold">{plan?.id ?? drill?.planId ?? "Emergency ZEC Recovery"}</p>
        </div>
        <div className="border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_rgba(17,18,15,0.12)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/58">Threshold</p>
          <p className="mt-1 font-semibold">2-of-3</p>
        </div>
        <div className="border-2 border-ink bg-zcash p-4 text-ink shadow-[3px_3px_0_rgba(17,18,15,0.18)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/62">Status</p>
          <p className="mt-1 font-semibold">{acknowledged >= 2 ? `Ready, ${acknowledged}/3 confirmed` : `Not ready, ${acknowledged}/3 confirmed`}</p>
        </div>
      </div>
      {plan?.packageHash || drill ? (
        <div className="mb-5 memo-paper border-2 border-ink p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/58">Package hash</p>
          <code className="hash-text mt-2 block text-sm">{plan?.packageHash ?? drill?.packageHash}</code>
        </div>
      ) : null}
      <div className="grid gap-3">
        {guardians.map(([name, status, kind]) => {
          const Icon = kind === "ready" ? CheckCircle2 : Clock;
          const guardianRecord = storedGuardians.find((guardian) => guardian.name === name || guardian.id === name);
          return (
            <div key={name} className="flex items-center justify-between gap-4 border-2 border-ink bg-white p-4 shadow-[3px_3px_0_rgba(17,18,15,0.1)]">
              <div className="flex items-center gap-3">
                <Icon className={`size-5 ${kind === "ready" ? "text-guard" : "text-warning"}`} aria-hidden="true" />
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-ink/62">{status}</p>
                  {encryptedPackage ? (
                    <p className="hash-text mt-1 font-mono text-[11px] text-ink/45">
                      {guardianRecord?.inviteTxid ? `invite txid: ${guardianRecord.inviteTxid}` : "invite txid: not recorded"}
                    </p>
                  ) : null}
                </div>
              </div>
              <Radio className="size-5 text-ink/35" aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </>
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_invited: "Not invited",
    invite_generated: "Invite generated",
    invite_sent: "Invite sent",
    invite_txid_recorded: "Invite txid recorded",
    ack_pending: "ACK pending",
    ack_received: "ACK received",
    failed: "Failed"
  };
  return labels[status] ?? status;
}

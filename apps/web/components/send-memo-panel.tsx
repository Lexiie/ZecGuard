"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, RadioTower, Send, Signal, WifiOff } from "lucide-react";
import { usePlanStore } from "@/lib/storage/plan-store";
import { getBridgeHealth, sendMemoWithBridge, type BridgeHealth } from "@/lib/zcash/bridge-client";
import { parseZecGuardMemo } from "@/lib/zcash/memo";

export function SendMemoPanel() {
  const plan = usePlanStore((state) => state.plan);
  const guardians = usePlanStore((state) => state.guardians);
  const memoRecords = usePlanStore((state) => state.memoRecords);
  const upsertMemoRecord = usePlanStore((state) => state.upsertMemoRecord);
  const updateGuardian = usePlanStore((state) => state.updateGuardian);
  const [bridgeHealth, setBridgeHealth] = useState<BridgeHealth | null>(null);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [ackMessage, setAckMessage] = useState<string | null>(null);

  const invites = memoRecords.filter((record) => record.type === "GUARDIAN_INVITE");
  const selectedInvite = invites[0];
  const guardian = guardians.find((item) => item.id === selectedInvite?.guardianId);

  useEffect(() => {
    getBridgeHealth()
      .then((health) => {
        setBridgeHealth(health);
        setBridgeError(null);
      })
      .catch((error: unknown) => {
        setBridgeHealth(null);
        setBridgeError(error instanceof Error ? error.message : "Bridge unavailable");
      });
  }, []);

  async function copyMemo() {
    if (selectedInvite) {
      await navigator.clipboard.writeText(selectedInvite.memo);
    }
  }

  function recordInviteTxid(txid: string) {
    if (!selectedInvite || !guardian) {
      return;
    }
    upsertMemoRecord({ ...selectedInvite, txid, status: "recorded" });
    updateGuardian(guardian.id, { inviteTxid: txid, status: "ack_pending" });
  }

  async function sendWithBridge() {
    if (!selectedInvite || !guardian) {
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      const result = await sendMemoWithBridge({
        to: guardian.zcashAddress,
        amount: "0.0001",
        memo: selectedInvite.memo
      });

      if (!result.ok || !result.txid) {
        throw new Error(result.error ?? "Bridge did not return a txid");
      }

      recordInviteTxid(result.txid);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Unable to send memo with bridge");
    } finally {
      setIsSending(false);
    }
  }

  function parseAckMemo(rawMemo: string, txid: string) {
    if (!plan) {
      return;
    }

    try {
      const parsed = parseZecGuardMemo(rawMemo);
      if (parsed.type !== "GUARDIAN_ACK") {
        throw new Error("Memo is not a GUARDIAN_ACK");
      }
      if (parsed.plan_id !== plan.id) {
        throw new Error("ACK plan_id does not match the active plan");
      }
      if (parsed.package_hash !== plan.packageHash) {
        throw new Error("ACK package_hash does not match the active package");
      }
      if (!parsed.guardian_id) {
        throw new Error("ACK is missing guardian_id");
      }

      const matchingGuardian = guardians.find((item) => item.id === parsed.guardian_id);
      if (!matchingGuardian) {
        throw new Error("ACK guardian_id is not in this plan");
      }

      upsertMemoRecord({
        id: `${plan.id}:${parsed.guardian_id}:ack:manual`,
        planId: plan.id,
        guardianId: parsed.guardian_id,
        type: "GUARDIAN_ACK",
        memo: rawMemo,
        txid: txid || undefined,
        direction: "guardian_to_owner",
        status: "recorded",
        createdAt: new Date().toISOString()
      });
      updateGuardian(parsed.guardian_id, { ackTxid: txid || undefined, status: "ack_received" });
      setAckMessage(`ACK recorded for ${matchingGuardian.name}`);
    } catch (error) {
      setAckMessage(error instanceof Error ? error.message : "Unable to parse ACK memo");
    }
  }

  if (!plan || !selectedInvite) {
    return (
      <div className="border-2 border-warning bg-[#fff7da] p-4 text-sm leading-6 text-ink">
        Generate package artifacts first on the package page. The invite memo is created by the local MVP drill.
        <Link className="mt-3 inline-flex border-2 border-ink bg-ink px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-paper" href="/package">
          Go to package
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BridgeStatus health={bridgeHealth} error={bridgeError} />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
          <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">Guardian invite memo</p>
            <h2 className="mt-1 text-xl font-semibold">{guardian?.name ?? selectedInvite.guardianId}</h2>
          </div>
          <div className="p-5">
            <pre className="memo-paper hash-text overflow-x-auto border-2 border-ink p-4 font-mono text-sm leading-7 text-ink shadow-[4px_4px_0_rgba(240,185,45,0.28)]">{selectedInvite.memo}</pre>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={sendWithBridge} disabled={isSending || !guardian?.zcashAddress}>
                <Send size={18} aria-hidden="true" />
                {isSending ? "Sending" : "Send with bridge"}
              </button>
              <button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-white px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em]" type="button" onClick={copyMemo}>
                <Copy size={18} aria-hidden="true" />
                Copy memo
              </button>
            </div>
            {sendError ? <p className="mt-4 border-2 border-warning bg-[#fff7da] p-3 text-sm text-warning">{sendError}</p> : null}
          </div>
        </section>
        <ManualProofPanel onRecord={recordInviteTxid} txid={selectedInvite.txid} />
      </div>
      <AckParserPanel onParse={parseAckMemo} message={ackMessage} />
    </div>
  );
}

function BridgeStatus({ health, error }: { health: BridgeHealth | null; error: string | null }) {
  const available = health?.wallet === "available";
  return (
    <div className={`flex items-start gap-3 border-2 p-4 text-sm leading-6 shadow-[4px_4px_0_rgba(17,18,15,0.12)] ${available ? "border-guard bg-mint" : "border-warning bg-[#fff7da]"}`}>
      {available ? <Signal className="mt-0.5 size-5 text-guard" aria-hidden="true" /> : <WifiOff className="mt-0.5 size-5 text-warning" aria-hidden="true" />}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Local bridge {available ? "available" : "fallback mode"}</p>
        <p>{available ? "Bridge health check passed. You can try sending the invite memo locally." : error ?? health?.error ?? "Bridge or wallet unavailable. Copy/manual txid fallback remains usable."}</p>
      </div>
    </div>
  );
}

function ManualProofPanel({ onRecord, txid }: { onRecord: (txid: string) => void; txid?: string }) {
  return (
    <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
      <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">Manual proof</p>
        <h2 className="mt-1 text-xl font-semibold">Record invite txid</h2>
      </div>
      <form
        className="space-y-4 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextTxid = String(formData.get("txid") ?? "").trim();
          if (nextTxid) {
            onRecord(nextTxid);
          }
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          Invite txid
          <input name="txid" className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm shadow-[3px_3px_0_rgba(17,18,15,0.12)]" placeholder="Paste transaction id" defaultValue={txid} />
        </label>
        <button className="inline-flex items-center gap-2 border-2 border-ink bg-zcash px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink" type="submit">
          <RadioTower size={17} aria-hidden="true" />
          Mark invite sent
        </button>
      </form>
    </section>
  );
}

function AckParserPanel({ onParse, message }: { onParse: (memo: string, txid: string) => void; message: string | null }) {
  return (
    <section className="border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]">
      <div className="border-b-2 border-ink bg-rail px-5 py-4 text-paper">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">Guardian ACK</p>
        <h2 className="mt-1 text-xl font-semibold">Paste and parse ACK memo</h2>
      </div>
      <form
        className="grid gap-4 p-5 lg:grid-cols-[1fr_20rem]"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onParse(String(formData.get("ackMemo") ?? ""), String(formData.get("ackTxid") ?? "").trim());
        }}
      >
        <label className="grid gap-2 text-sm font-medium">
          ACK memo
          <textarea name="ackMemo" className="memo-paper min-h-40 border-2 border-ink px-3 py-2 font-mono text-sm leading-7 shadow-[3px_3px_0_rgba(17,18,15,0.12)]" placeholder="ZECGUARD:v0&#10;type:GUARDIAN_ACK&#10;..." />
        </label>
        <div className="space-y-4">
          <label className="grid gap-2 text-sm font-medium">
            ACK txid
            <input name="ackTxid" className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm shadow-[3px_3px_0_rgba(17,18,15,0.12)]" placeholder="Optional txid" />
          </label>
          <button className="inline-flex items-center gap-2 border-2 border-ink bg-zcash px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink" type="submit">
            Parse ACK
          </button>
          {message ? <p className="border-2 border-ink bg-paper p-3 text-sm leading-6 text-ink">{message}</p> : null}
        </div>
      </form>
    </section>
  );
}

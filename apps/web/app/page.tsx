import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Braces, KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { PrototypeWarning } from "@/components/prototype-warning";

const ceremonySteps = [
  ["01", "Plan", "Owner note, wallet context, threshold."],
  ["02", "Seal", "AES-GCM package and SHA-256 hash."],
  ["03", "Split", "Package key divided into guardian shares."],
  ["04", "Memo", "Invite and ACK over shielded memos."],
  ["05", "Drill", "Reconstruct, decrypt, verify hash."]
];

const memoPreview = `ZECGUARD:v0
type:GUARDIAN_INVITE
plan_id:zg_plan_demo
guardian_id:g1
threshold:2-of-3
package_hash:sha256:8f42...c019
reply_to:u1-owner-shielded-address`;

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PrototypeWarning />
      <section className="grid min-h-[calc(100dvh-14rem)] gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-2 border-ink bg-paper p-5 shadow-[8px_8px_0_rgba(17,18,15,0.18)] sm:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70">
            <span className="border border-ink bg-zcash px-2 py-1 text-ink">FROST-adjacent MVP</span>
            <span className="border border-ink bg-white px-2 py-1">Local-first</span>
            <span className="border border-ink bg-white px-2 py-1">No deadman switch</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.05em] text-ink sm:text-5xl lg:text-6xl">
            Seal the plan. Wake the guardians.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink/72">
            A local recovery ceremony for encrypted Zcash packages, threshold shares, and shielded memo ACKs.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#f0b92d]"
            >
              Start plan
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/send"
              className="inline-flex items-center justify-center border-2 border-ink bg-white px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink transition hover:bg-zcash active:translate-y-0.5"
            >
              Inspect memo
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Signal icon={<ShieldCheck size={18} />} label="No custody" value="0 uploaded secrets" />
            <Signal icon={<KeyRound size={18} />} label="Threshold" value="2 / 3 guardians" />
            <Signal icon={<MessageSquareText size={18} />} label="Coordination" value="Shielded memos" />
          </div>
        </div>

        <div className="grid gap-5">
          <div className="border-2 border-ink bg-rail text-paper shadow-[8px_8px_0_rgba(17,18,15,0.2)]">
            <div className="flex items-center justify-between border-b-2 border-paper/25 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70">
              <span>Recovery ceremony tape</span>
              <span className="text-zcash">v0</span>
            </div>
            <div className="divide-y divide-paper/15">
              {ceremonySteps.map(([step, title, body]) => (
                <div key={step} className="grid grid-cols-[4.5rem_1fr] gap-4 px-4 py-4">
                  <span className="font-mono text-sm text-zcash">{step}</span>
                  <div>
                    <p className="font-semibold tracking-[-0.01em]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-paper/62">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="memo-paper border-2 border-ink p-4 shadow-[8px_8px_0_rgba(240,185,45,0.32)]">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/62">
              <Braces size={15} aria-hidden="true" />
              Memo payload specimen
            </div>
            <pre className="hash-text whitespace-pre-wrap font-mono text-sm leading-7 text-ink">{memoPreview}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function Signal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border-2 border-ink bg-white p-3 shadow-[3px_3px_0_rgba(17,18,15,0.14)]">
      <div className="mb-3 text-guard">{icon}</div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/55">{label}</p>
      <p className="mt-1 font-semibold tracking-[-0.01em]">{value}</p>
    </div>
  );
}

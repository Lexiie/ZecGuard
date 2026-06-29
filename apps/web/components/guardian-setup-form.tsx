"use client";

import Link from "next/link";
import { ArrowRight, Save } from "lucide-react";
import { usePlanStore } from "@/lib/storage/plan-store";

const inputClass = "border-2 border-ink bg-white px-3 py-2 font-mono text-sm";

export function GuardianSetupForm() {
  const plan = usePlanStore((state) => state.plan);
  const guardians = usePlanStore((state) => state.guardians);
  const setGuardians = usePlanStore((state) => state.setGuardians);

  function updateGuardian(index: number, field: "name" | "zcashAddress", value: string) {
    setGuardians(guardians.map((guardian, currentIndex) => (currentIndex === index ? { ...guardian, [field]: value } : guardian)));
  }

  const hasPlan = Boolean(plan);
  const ready = hasPlan && guardians.every((guardian) => guardian.name.trim() && guardian.zcashAddress.trim());

  return (
    <div className="space-y-5">
      {!hasPlan ? (
        <div className="border-2 border-warning bg-[#fff7da] p-4 text-sm leading-6 text-ink">
          Create and save a recovery plan first. Guardian setup is bound to a plan ID.
        </div>
      ) : null}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Threshold
          <select className="border-2 border-ink bg-paper px-3 py-2 font-mono text-sm shadow-[3px_3px_0_rgba(17,18,15,0.12)]" value="2-of-3" disabled>
            <option>2-of-3</option>
          </select>
        </label>
        <div className="border-2 border-ink bg-zcash p-4 font-mono text-xs uppercase leading-6 tracking-[0.12em] text-ink shadow-[3px_3px_0_rgba(17,18,15,0.14)]">
          Shares are stored outside memos in the MVP. Memos carry coordination only.
        </div>
      </div>
      <div className="grid gap-4">
        {guardians.map((guardian, index) => (
          <div key={guardian.id} className="grid gap-3 border-2 border-ink bg-paper p-4 shadow-[4px_4px_0_rgba(17,18,15,0.12)] md:grid-cols-[12rem_1fr]">
            <label className="grid gap-2 text-sm font-medium">
              Alias
              <input className={inputClass} value={guardian.name} onChange={(event) => updateGuardian(index, "name", event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Shielded or unified Zcash address
              <input className={inputClass} value={guardian.zcashAddress} onChange={(event) => updateGuardian(index, "zcashAddress", event.target.value)} placeholder={`Guardian ${index + 1} address`} />
            </label>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d]" type="button" onClick={() => setGuardians(guardians)}>
          <Save size={16} aria-hidden="true" />
          Save guardians
        </button>
        {ready ? (
          <Link className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-zcash px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink" href="/package">
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

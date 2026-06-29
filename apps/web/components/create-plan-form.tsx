"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Save } from "lucide-react";
import { usePlanStore, type RecoveryPlanDraft } from "@/lib/storage/plan-store";
import { createPlanId } from "@/lib/zcash/plan-id";

const inputClass = "border-2 border-ink bg-paper px-3 py-2 font-mono text-sm shadow-[3px_3px_0_rgba(17,18,15,0.12)]";
const textareaClass = "memo-paper min-h-28 border-2 border-ink px-3 py-2 font-mono text-sm leading-7 shadow-[3px_3px_0_rgba(17,18,15,0.12)]";

export function CreatePlanForm() {
  const storedPlan = usePlanStore((state) => state.plan);
  const setPlan = usePlanStore((state) => state.setPlan);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => ({
    name: storedPlan?.name ?? "Emergency ZEC Recovery",
    ownerAlias: storedPlan?.ownerAlias ?? "Owner",
    walletType: storedPlan?.walletType ?? "Zashi",
    recoveryInstructions: storedPlan?.recoveryInstructions ?? "Demo drill: recover with any two guardian shares and verify the package hash.",
    emergencyNote: storedPlan?.emergencyNote ?? "This MVP uses dummy material only. Do not store a real seed phrase here.",
    dummySecret: storedPlan?.dummySecret ?? "dummy-zecguard-secret-never-a-real-seed"
  }));

  function updateField(field: keyof typeof form, value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveDraft() {
    const plan: RecoveryPlanDraft = {
      id: storedPlan?.id ?? createPlanId(),
      version: "0.1",
      name: form.name.trim(),
      ownerAlias: form.ownerAlias.trim(),
      walletType: form.walletType,
      recoveryInstructions: form.recoveryInstructions.trim(),
      emergencyNote: form.emergencyNote.trim(),
      dummySecret: form.dummySecret.trim(),
      threshold: 2,
      totalGuardians: 3,
      createdAt: storedPlan?.createdAt ?? new Date().toISOString(),
      packageHash: storedPlan?.packageHash,
      status: storedPlan?.status ?? "draft"
    };

    setPlan(plan);
    setSaved(true);
  }

  return (
    <form className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">
        Plan name
        <input className={inputClass} value={form.name} onChange={(event) => updateField("name", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Owner alias
        <input className={inputClass} value={form.ownerAlias} onChange={(event) => updateField("ownerAlias", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Wallet type
        <select className={inputClass} value={form.walletType} onChange={(event) => updateField("walletType", event.target.value)}>
          <option>Zashi</option>
          <option>YWallet</option>
          <option>Zingo</option>
          <option>Other Zcash wallet</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Dummy secret label
        <input className={inputClass} value={form.dummySecret} onChange={(event) => updateField("dummySecret", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        Recovery instructions
        <textarea className={textareaClass} value={form.recoveryInstructions} onChange={(event) => updateField("recoveryInstructions", event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        Emergency note
        <textarea className={textareaClass} value={form.emergencyNote} onChange={(event) => updateField("emergencyNote", event.target.value)} />
      </label>
      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
        <button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper shadow-[4px_4px_0_#f0b92d]" type="button" onClick={saveDraft}>
          <Save size={16} aria-hidden="true" />
          Save draft locally
        </button>
        {saved ? (
          <Link className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-zcash px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.12em] text-ink" href="/guardians">
            Continue
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </form>
  );
}

import { AlertTriangle } from "lucide-react";

export function PrototypeWarning() {
  return (
    <div className="grid gap-3 border-2 border-warning bg-[#fff7da] p-4 text-sm text-ink shadow-[4px_4px_0_rgba(154,90,0,0.2)] sm:grid-cols-[auto_1fr]">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" strokeWidth={2.2} aria-hidden="true" />
      <p className="leading-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-warning">Prototype boundary</span>
        <span className="block">Use dummy secrets only. No real seed phrase, spending key, or high-value recovery material belongs in this MVP.</span>
      </p>
    </div>
  );
}

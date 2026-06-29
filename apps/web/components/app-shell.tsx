import Link from "next/link";
import type { ReactNode } from "react";
import { CircleDotDashed, ShieldCheck } from "lucide-react";

const navItems = [
  ["Create", "/create"],
  ["Guardians", "/guardians"],
  ["Package", "/package"],
  ["Send", "/send"],
  ["Dashboard", "/dashboard"],
  ["Reconstruct", "/reconstruct"],
  ["Docs", "/docs"]
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="zecguard-grid min-h-screen text-ink">
      <header className="border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-stretch lg:justify-between">
          <Link href="/" className="group flex items-center gap-3 font-semibold">
            <span className="relative grid size-12 place-items-center border-2 border-ink bg-zcash text-ink shadow-[4px_4px_0_#11120f] transition group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[2px_2px_0_#11120f]">
              <ShieldCheck size={23} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl leading-tight tracking-[-0.02em]">ZecGuard</span>
              <span className="block font-mono text-[11px] uppercase tracking-[0.22em] text-ink/62">Shielded recovery desk</span>
            </span>
          </Link>
          <nav className="flex gap-1 overflow-x-auto border border-ink bg-white/70 p-1 text-sm shadow-[3px_3px_0_rgba(17,18,15,0.16)] lg:pb-1" aria-label="Main navigation">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em] text-ink/72 transition hover:bg-ink hover:text-paper"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-ink/15 bg-rail text-paper">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] sm:px-6">
            <CircleDotDashed className="size-3.5 text-zcash" aria-hidden="true" />
            <span>Local only</span>
            <span className="text-paper/35">/</span>
            <span>No custody</span>
            <span className="text-paper/35">/</span>
            <span>Memo coordination, not secret release</span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

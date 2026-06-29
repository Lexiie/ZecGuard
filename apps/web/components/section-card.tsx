import { clsx } from "clsx";
import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, description, children, className }: SectionCardProps) {
  return (
    <section className={clsx("border-2 border-ink bg-white shadow-[6px_6px_0_rgba(17,18,15,0.16)]", className)}>
      <div className="border-b-2 border-ink bg-rail px-4 py-3 text-paper sm:px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zcash">ZecGuard module</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-paper">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-paper/70">{description}</p> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

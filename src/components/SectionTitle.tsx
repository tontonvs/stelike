import type { ReactNode } from "react";

/** Centered title with thin gold rules on either side — e.g. "TOP DEALS". */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="divider-gold flex items-center gap-4">
      <h2 className="font-display shrink-0 text-lg font-semibold uppercase tracking-wide text-primary sm:text-xl">
        {children}
      </h2>
    </div>
  );
}

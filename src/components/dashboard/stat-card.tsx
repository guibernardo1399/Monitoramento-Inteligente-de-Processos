import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ReactNode;
  href?: string;
}) {
  const content = (
    <Card className="h-full bg-white/90">
      <div className="flex min-h-[180px] items-start justify-between gap-4">
        <div className="flex min-h-[180px] flex-1 flex-col">
          <p className="min-h-[56px] text-sm leading-7 text-steel">{label}</p>
          <h3 className="mt-2 text-3xl font-semibold text-ink">{value}</h3>
          <p className="mt-2 text-sm text-steel">{hint}</p>
          {href ? (
            <p className="mt-auto pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Clique Para Abrir
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand">{icon}</div>
      </div>
    </Card>
  );

  if (!href) return content;

  return (
    <a href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </a>
  );
}

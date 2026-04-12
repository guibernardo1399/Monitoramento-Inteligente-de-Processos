import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-white/70 bg-white p-5 shadow-panel", className)}>
      {children}
    </div>
  );
}

import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement> & {
  className?: string;
}>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-2xl border border-white/70 bg-white p-5 shadow-panel", className)}
      {...props}
    >
      {children}
    </div>
  );
}

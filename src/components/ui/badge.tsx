import { alertStatusConfig, severityConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.INFO;

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: string }) {
  const label = alertStatusConfig[status as keyof typeof alertStatusConfig] || status;

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}

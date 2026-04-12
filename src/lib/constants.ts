export const APP_NAME = "Monitoramento Inteligente de Processos";

export const severityConfig = {
  INFO: {
    label: "Informativo",
    className: "bg-slate-100 text-slate-700",
  },
  ATTENTION: {
    label: "Atenção",
    className: "bg-amber-100 text-amber-800",
  },
  CRITICAL: {
    label: "Crítico",
    className: "bg-rose-100 text-rose-800",
  },
} as const;

export const alertStatusConfig = {
  UNREAD: "Novo",
  READ: "Lido",
  REVIEWED: "Revisado",
  NO_IMPACT: "Sem impacto",
} as const;

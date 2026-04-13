import { FileText, Gavel, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { SeverityBadge } from "@/components/ui/badge";

type TimelineItem = {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: "movement" | "publication" | "alert";
  severity?: string;
  sourceUrl?: string | null;
};

export function ProcessTimeline({ items }: { items: TimelineItem[] }) {
  function buildEventLabel(item: TimelineItem) {
    if (item.type === "publication") {
      return `Publicada em ${formatDateTime(item.date)}`;
    }

    if (item.type === "alert") {
      return `Gerado em ${formatDateTime(item.date)}`;
    }

    return `Registrada em ${formatDateTime(item.date)}`;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="relative rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="absolute left-4 top-5 h-[calc(100%-1.25rem)] w-px bg-line" />
          <div className="relative flex gap-4">
            <div className="z-10 rounded-2xl bg-brand-50 p-2 text-brand">
              {item.type === "movement" ? (
                <Gavel className="h-4 w-4" />
              ) : item.type === "publication" ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h4 className="text-sm font-semibold text-ink">{item.title}</h4>
                <div className="flex items-center gap-2">
                  {item.severity ? <SeverityBadge severity={item.severity} /> : null}
                  <span className="text-xs text-steel">{formatDateTime(item.date)}</span>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">{buildEventLabel(item)}</p>
              <p className="mt-2 text-sm leading-6 text-steel">{item.description}</p>
              {item.sourceUrl ? (
                <div className="mt-3">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand ring-1 ring-line transition hover:bg-slate-50"
                  >
                    Abrir Documento Oficial
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

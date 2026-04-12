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
};

export function ProcessTimeline({ items }: { items: TimelineItem[] }) {
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
              <p className="mt-2 text-sm leading-6 text-steel">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

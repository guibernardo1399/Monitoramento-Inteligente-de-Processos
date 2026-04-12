import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportButton({ processId }: { processId: string }) {
  return (
    <a href={`/api/processes/${processId}/report`} target="_blank" rel="noreferrer">
      <Button variant="secondary">
        <Download className="mr-2 h-4 w-4" />
        Relatorio em PDF
      </Button>
    </a>
  );
}

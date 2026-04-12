import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate, formatDateTime } from "@/lib/utils";
import { severityConfig } from "@/lib/constants";

type ReportProcess = {
  cnjNumber: string;
  court: string;
  className: string;
  subject: string;
  judgingBody: string;
  lawyerName: string | null;
  lawyerOab: string | null;
  notes: string | null;
  client: {
    name: string;
    document: string | null;
  };
  movements: Array<{
    movementDate: Date;
    title: string;
    description: string;
  }>;
  publications: Array<{
    publicationDate: Date;
    title: string;
    content: string;
    source: string;
    hasDeadlineHint: boolean;
  }>;
  alerts: Array<{
    createdAt: Date;
    title: string;
    message: string;
    severity: string;
    status: string;
  }>;
};

function wrapText(text: string, maxLength = 92) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export async function generateProcessPdfReport(process: ReportProcess) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 46;
  const top = 795;
  let y = top;

  function ensureSpace(linesNeeded = 3) {
    if (y < 70 + linesNeeded * 16) {
      page = pdf.addPage([595, 842]);
      y = top;
    }
  }

  function drawLine(text: string, options?: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> }) {
    ensureSpace();
    page.drawText(text, {
      x: marginX,
      y,
      size: options?.size || 10.5,
      font: options?.bold ? bold : regular,
      color: options?.color || rgb(0.12, 0.17, 0.24),
    });
    y -= (options?.size || 10.5) + 6;
  }

  function drawParagraph(text: string) {
    const lines = wrapText(text, 88);
    ensureSpace(lines.length + 1);
    for (const line of lines) {
      page.drawText(line, {
        x: marginX,
        y,
        size: 10.5,
        font: regular,
        color: rgb(0.27, 0.33, 0.39),
      });
      y -= 16;
    }
    y -= 4;
  }

  function drawSection(title: string) {
    ensureSpace(4);
    y -= 4;
    page.drawText(title, {
      x: marginX,
      y,
      size: 13,
      font: bold,
      color: rgb(0.07, 0.2, 0.29),
    });
    y -= 18;
    page.drawLine({
      start: { x: marginX, y: y + 8 },
      end: { x: 550, y: y + 8 },
      thickness: 1,
      color: rgb(0.86, 0.89, 0.92),
    });
    y -= 10;
  }

  drawLine("Relatorio do cliente e andamento processual", {
    size: 18,
    bold: true,
    color: rgb(0.07, 0.2, 0.29),
  });
  drawLine("Monitoramento Inteligente de Processos", {
    size: 11,
    color: rgb(0.34, 0.41, 0.48),
  });
  drawLine(`Gerado em ${formatDateTime(new Date())}`, {
    size: 9.5,
    color: rgb(0.45, 0.5, 0.56),
  });

  y -= 8;
  drawSection("Resumo executivo");
  drawLine(`Cliente: ${process.client.name}`, { bold: true });
  drawLine(`Documento: ${process.client.document || "Nao informado"}`);
  drawLine(`Processo CNJ: ${process.cnjNumber}`);
  drawLine(`Advogado monitorado: ${process.lawyerName || "Nao informado"} • ${process.lawyerOab || "OAB nao informada"}`);
  drawLine(`Tribunal: ${process.court} • ${process.judgingBody}`);
  drawLine(`Classe/assunto: ${process.className} • ${process.subject}`);

  drawSection("Status atual");
  drawParagraph(
    `O processo esta sendo acompanhado com foco em atualizacoes, publicacoes e alertas operacionais. Este documento serve como apoio de acompanhamento e nao substitui revisao juridica humana.`,
  );
  if (process.notes) {
    drawLine("Observacoes internas relevantes:", { bold: true });
    drawParagraph(process.notes);
  }

  drawSection("Alertas");
  if (process.alerts.length === 0) {
    drawParagraph("Nao ha alertas registrados para este processo no momento.");
  } else {
    for (const alert of process.alerts.slice(0, 6)) {
      const sev = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.INFO;
      drawLine(
        `${sev.label} • ${alert.title} • ${formatDateTime(alert.createdAt)} • Status: ${alert.status}`,
        { bold: true },
      );
      drawParagraph(alert.message);
    }
  }

  drawSection("Ultimas movimentacoes");
  if (process.movements.length === 0) {
    drawParagraph("Nenhuma movimentacao encontrada.");
  } else {
    for (const movement of process.movements.slice(0, 8)) {
      drawLine(`${formatDateTime(movement.movementDate)} • ${movement.title}`, { bold: true });
      drawParagraph(movement.description);
    }
  }

  drawSection("Publicacoes e comunicacoes");
  if (process.publications.length === 0) {
    drawParagraph("Nenhuma publicacao encontrada.");
  } else {
    for (const publication of process.publications.slice(0, 6)) {
      drawLine(
        `${formatDateTime(publication.publicationDate)} • ${publication.source} • ${publication.title}${publication.hasDeadlineHint ? " • Potencial prazo" : ""}`,
        { bold: true },
      );
      drawParagraph(publication.content);
    }
  }

  drawSection("Observacao importante");
  drawParagraph(
    `Este relatorio resume o andamento conhecido do processo ate ${formatDate(new Date())}. Qualquer sugestao de prazo ou urgencia exige conferência humana do advogado responsavel.`,
  );

  return Buffer.from(await pdf.save());
}

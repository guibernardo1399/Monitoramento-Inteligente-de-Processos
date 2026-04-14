import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDate, formatDateTime, summarizeText } from "@/lib/utils";
import { severityConfig } from "@/lib/constants";
import { buildMovementSummary, buildPublicationSummary } from "@/modules/processes/summaries";

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
    availabilityDate?: Date | null;
    title: string;
    excerpt?: string | null;
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

function wrapText(text: string, maxLength = 82) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
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

function normalizeAlertStatus(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "Novo";
  if (normalized === "READ") return "Lido";
  if (normalized === "REVIEWED") return "Revisado";
  if (normalized === "DISMISSED") return "Sem impacto";
  return status;
}

export async function generateProcessPdfReport(process: ReportProcess) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const colors = {
    ink: rgb(0.11, 0.16, 0.22),
    muted: rgb(0.39, 0.45, 0.52),
    line: rgb(0.85, 0.89, 0.93),
    brand: rgb(0.09, 0.23, 0.34),
    brandSoft: rgb(0.93, 0.96, 0.98),
    attention: rgb(0.97, 0.64, 0.16),
    critical: rgb(0.77, 0.17, 0.17),
    info: rgb(0.12, 0.33, 0.53),
    surface: rgb(0.98, 0.99, 1),
  };

  const marginX = 42;
  const contentWidth = 595 - marginX * 2;
  const top = 800;
  let y = top;

  function newPage() {
    page = pdf.addPage([595, 842]);
    y = top;
  }

  function ensureSpace(height = 60) {
    if (y - height < 42) {
      newPage();
    }
  }

  function drawTextLine(
    text: string,
    x: number,
    lineY: number,
    options?: { size?: number; font?: "regular" | "bold"; color?: ReturnType<typeof rgb> },
  ) {
    page.drawText(text, {
      x,
      y: lineY,
      size: options?.size || 10.5,
      font: options?.font === "bold" ? bold : regular,
      color: options?.color || colors.ink,
    });
  }

  function drawWrappedParagraph(
    text: string,
    options?: { x?: number; widthChars?: number; size?: number; color?: ReturnType<typeof rgb> },
  ) {
    const lines = wrapText(text, options?.widthChars || 82);
    ensureSpace(lines.length * 16 + 10);

    for (const line of lines) {
      drawTextLine(line, options?.x || marginX, y, {
        size: options?.size || 10.5,
        color: options?.color || colors.muted,
      });
      y -= 15;
    }

    y -= 4;
  }

  function drawDivider() {
    page.drawLine({
      start: { x: marginX, y },
      end: { x: marginX + contentWidth, y },
      thickness: 1,
      color: colors.line,
    });
    y -= 14;
  }

  function drawSectionTitle(title: string, subtitle?: string) {
    ensureSpace(70);
    drawTextLine(title, marginX, y, {
      size: 14,
      font: "bold",
      color: colors.brand,
    });
    y -= 20;

    if (subtitle) {
      drawWrappedParagraph(subtitle, { color: colors.muted, widthChars: 84 });
    }

    drawDivider();
  }

  function drawInfoBox(title: string, lines: string[], accent = colors.brandSoft) {
    const wrapped = lines.flatMap((line) => wrapText(line, 78));
    const boxHeight = 34 + wrapped.length * 15;
    ensureSpace(boxHeight + 14);

    page.drawRectangle({
      x: marginX,
      y: y - boxHeight + 8,
      width: contentWidth,
      height: boxHeight,
      color: accent,
      borderColor: colors.line,
      borderWidth: 1,
    });

    drawTextLine(title, marginX + 14, y - 10, {
      size: 11.5,
      font: "bold",
      color: colors.brand,
    });

    let lineY = y - 28;
    for (const line of wrapped) {
      drawTextLine(line, marginX + 14, lineY, {
        size: 10,
        color: colors.ink,
      });
      lineY -= 14;
    }

    y -= boxHeight + 10;
  }

  function drawEntryBlock(title: string, meta: string, body: string, accent?: ReturnType<typeof rgb>) {
    const metaLines = wrapText(meta, 78);
    const bodyLines = wrapText(body, 80);
    const blockHeight = 30 + metaLines.length * 14 + bodyLines.length * 15;
    ensureSpace(blockHeight + 10);

    page.drawRectangle({
      x: marginX,
      y: y - blockHeight + 8,
      width: contentWidth,
      height: blockHeight,
      color: colors.surface,
      borderColor: colors.line,
      borderWidth: 1,
    });

    if (accent) {
      page.drawRectangle({
        x: marginX,
        y: y - blockHeight + 8,
        width: 6,
        height: blockHeight,
        color: accent,
      });
    }

    let lineY = y - 10;
    drawTextLine(title, marginX + 18, lineY, {
      size: 11.5,
      font: "bold",
      color: colors.ink,
    });
    lineY -= 18;

    for (const line of metaLines) {
      drawTextLine(line, marginX + 18, lineY, {
        size: 9.5,
        color: colors.info,
      });
      lineY -= 13;
    }

    for (const line of bodyLines) {
      drawTextLine(line, marginX + 18, lineY, {
        size: 10,
        color: colors.muted,
      });
      lineY -= 14;
    }

    y -= blockHeight + 10;
  }

  function drawHeader() {
    page.drawRectangle({
      x: 0,
      y: 760,
      width: 595,
      height: 82,
      color: colors.brand,
    });

    drawTextLine("Monitoramento Inteligente de Processos", marginX, 806, {
      size: 11,
      color: rgb(0.86, 0.92, 0.97),
    });
    drawTextLine("Relatório do Processo", marginX, 782, {
      size: 22,
      font: "bold",
      color: rgb(1, 1, 1),
    });

    y = 730;
  }

  function latestMovementDate() {
    return process.movements[0]?.movementDate || null;
  }

  function latestPublicationDate() {
    return process.publications[0]?.publicationDate || null;
  }

  drawHeader();

  drawInfoBox("Resumo do Processo", [
    `Cliente: ${process.client.name}${process.client.document ? ` • Documento: ${process.client.document}` : ""}`,
    `CNJ: ${process.cnjNumber}`,
    `Tribunal: ${process.court} • Órgão Julgador: ${process.judgingBody}`,
    `Classe: ${process.className}`,
    `Assunto: ${process.subject}`,
    `Advogado Monitorado: ${process.lawyerName || "Não informado"}${process.lawyerOab ? ` • ${process.lawyerOab}` : ""}`,
  ]);

  drawSectionTitle(
    "Visão Geral",
    "Este relatório organiza o andamento conhecido do processo, destacando o contexto atual, as últimas movimentações, as publicações oficiais e os alertas que merecem atenção.",
  );

  drawInfoBox(
    "Situação Atual",
    [
      `Última movimentação identificada: ${
        latestMovementDate() ? formatDateTime(latestMovementDate() as Date) : "Nenhuma movimentação encontrada"
      }`,
      `Última publicação oficial identificada: ${
        latestPublicationDate() ? formatDateTime(latestPublicationDate() as Date) : "Nenhuma publicação encontrada"
      }`,
      `Alertas ativos no processo: ${process.alerts.length}`,
    ],
    rgb(0.95, 0.97, 0.99),
  );

  if (process.notes) {
    drawInfoBox("Observações Internas", [process.notes], rgb(0.99, 0.97, 0.92));
  }

  drawSectionTitle("Alertas", "Itens que merecem acompanhamento do escritório.");
  if (process.alerts.length === 0) {
    drawWrappedParagraph("Não há alertas registrados para este processo no momento.");
  } else {
    for (const alert of process.alerts.slice(0, 6)) {
      const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.INFO;
      const accent =
        alert.severity === "CRITICAL"
          ? colors.critical
          : alert.severity === "ATTENTION"
            ? colors.attention
            : colors.info;

      drawEntryBlock(
        alert.title,
        `${config.label} • ${normalizeAlertStatus(alert.status)} • Alerta gerado em ${formatDateTime(alert.createdAt)}`,
        summarizeText(alert.message, 260),
        accent,
      );
    }
  }

  drawSectionTitle("Últimas Movimentações", "Andamentos mais recentes identificados para o processo.");
  if (process.movements.length === 0) {
    drawWrappedParagraph("Nenhuma movimentação encontrada.");
  } else {
    for (const movement of process.movements.slice(0, 8)) {
      drawEntryBlock(
        movement.title,
        `Movimentação registrada em ${formatDateTime(movement.movementDate)}`,
        summarizeText(buildMovementSummary(movement.title, movement.description), 260),
        colors.info,
      );
    }
  }

  drawSectionTitle(
    "Publicações Oficiais",
    "Publicações e comunicações localizadas para o processo até a data de emissão deste relatório.",
  );
  if (process.publications.length === 0) {
    drawWrappedParagraph("Nenhuma publicação oficial encontrada.");
  } else {
    for (const publication of process.publications.slice(0, 6)) {
      const metaParts = [
        `Publicação emitida em ${formatDateTime(publication.publicationDate)}`,
        publication.availabilityDate
          ? `Disponibilizada em ${formatDateTime(publication.availabilityDate)}`
          : null,
        publication.source,
        publication.hasDeadlineHint ? "Possível impacto em prazo" : null,
      ].filter(Boolean);

      drawEntryBlock(
        publication.title,
        metaParts.join(" • "),
        summarizeText(
          buildPublicationSummary({
            title: publication.title,
            excerpt: publication.excerpt,
            content: publication.content,
            hasDeadlineHint: publication.hasDeadlineHint,
          }),
          260,
        ),
        publication.hasDeadlineHint ? colors.attention : colors.info,
      );
    }
  }

  drawSectionTitle("Observação Importante");
  drawWrappedParagraph(
    `Este relatório resume o andamento conhecido do processo até ${formatDate(
      new Date(),
    )}. Qualquer sugestão de prazo, urgência ou providência depende de revisão humana do advogado responsável.`,
    { color: colors.ink },
  );

  return Buffer.from(await pdf.save());
}

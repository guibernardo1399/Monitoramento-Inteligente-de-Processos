import { ensureSentence, summarizeText } from "@/lib/utils";

function normalize(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function isGenericDescription(value: string) {
  return (
    !value ||
    /^(tipo de documento|tipo de petição|tipo de movimentação|movimentação processual|documento)\.?$/i.test(
      value,
    )
  );
}

export function buildMovementSummary(title: string, description?: string | null) {
  const normalizedTitle = normalize(title);
  const normalizedDescription = normalize(description);
  const loweredTitle = normalizedTitle.toLowerCase();

  if (normalizedDescription && !isGenericDescription(normalizedDescription)) {
    return ensureSentence(summarizeText(normalizedDescription, 190));
  }

  if (loweredTitle.includes("expedição de documento")) {
    return "O tribunal registrou a expedição de um documento no processo.";
  }

  if (loweredTitle.includes("petição")) {
    return "Foi registrada uma petição nos autos do processo.";
  }

  if (loweredTitle.includes("juntada")) {
    return "Houve juntada de documento ou petição nos autos do processo.";
  }

  if (loweredTitle.includes("conclus")) {
    return "O processo foi encaminhado para análise da unidade judicial.";
  }

  if (loweredTitle.includes("despacho")) {
    return "Foi registrado despacho judicial no processo.";
  }

  if (loweredTitle.includes("decisão")) {
    return "Foi registrada decisão judicial no processo.";
  }

  if (loweredTitle.includes("sentença")) {
    return "Foi registrada sentença no processo.";
  }

  if (loweredTitle.includes("audiência")) {
    return "Houve registro relacionado à audiência do processo.";
  }

  if (loweredTitle.includes("redistribuição")) {
    return "O processo recebeu registro de redistribuição.";
  }

  if (loweredTitle.includes("distribuição")) {
    return "O processo recebeu registro de distribuição.";
  }

  if (loweredTitle.includes("decurso de prazo")) {
    return "Houve registro de decurso de prazo no processo.";
  }

  if (loweredTitle.includes("certidão")) {
    return "Foi registrada certidão relacionada ao processo.";
  }

  if (loweredTitle.includes("intima")) {
    return "Houve registro de intimação no processo.";
  }

  if (loweredTitle.includes("cita")) {
    return "Houve registro de citação no processo.";
  }

  if (loweredTitle.includes("trânsito em julgado")) {
    return "Foi registrado trânsito em julgado no processo.";
  }

  if (loweredTitle.includes("baixa")) {
    return "Foi registrado andamento de baixa no processo.";
  }

  return `${normalizedTitle} registrada no processo.`;
}

export function buildPublicationSummary(input: {
  title: string;
  actType?: string | null;
  excerpt?: string | null;
  content: string;
  hasDeadlineHint?: boolean;
}) {
  const excerpt = normalize(input.excerpt) || normalize(input.content);
  const normalizedTitle = normalize(input.title);
  const lowered = `${normalizedTitle} ${normalize(input.actType)} ${excerpt}`.toLowerCase();

  const lead =
    input.hasDeadlineHint || ["prazo", "intima", "manifest", "recurso", "contest", "embargo"].some((term) => lowered.includes(term))
      ? "Publicação oficial com possível impacto em prazo ou providência."
      : ["sentença", "decisão", "despacho", "acórdão", "certidão", "edital"].some((term) => lowered.includes(term))
        ? "Publicação oficial relevante para análise do processo."
        : "Publicação oficial registrada para acompanhamento.";

  if (!excerpt) {
    return lead;
  }

  return `${lead} ${ensureSentence(summarizeText(excerpt, 180))}`;
}

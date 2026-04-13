import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCNJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 20);
  const parts = [
    digits.slice(0, 7),
    digits.slice(7, 9),
    digits.slice(9, 13),
    digits.slice(13, 14),
    digits.slice(14, 16),
    digits.slice(16, 20),
  ];

  let formatted = "";
  if (parts[0]) formatted += parts[0];
  if (parts[1]) formatted += `-${parts[1]}`;
  if (parts[2]) formatted += `.${parts[2]}`;
  if (parts[3]) formatted += `.${parts[3]}`;
  if (parts[4]) formatted += `.${parts[4]}`;
  if (parts[5]) formatted += `.${parts[5]}`;

  return formatted;
}

export function cnjRemainingDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return Math.max(20 - digits.length, 0);
}

export function isValidCNJ(value: string) {
  return /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(value);
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function normalizeExternalDateInput(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim();

  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return `${normalized}T00:00:00-03:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(normalized)) {
    return `${normalized}-03:00`;
  }

  return normalized;
}

export function summarizeText(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function humanizeIdentifier(value: string) {
  const smallWords = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "em",
    "para",
    "por",
    "com",
    "na",
    "no",
    "nas",
    "nos",
    "ao",
    "aos",
  ]);

  const normalized = value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");

  const corrected = normalized
    .replace(/\bmovimentacao\b/g, "movimentação")
    .replace(/\bdistribuicao\b/g, "distribuição")
    .replace(/\bexpedicao\b/g, "expedição")
    .replace(/\bpeticao\b/g, "petição")
    .replace(/\binclusao\b/g, "inclusão")
    .replace(/\bjuizo\b/g, "juízo")
    .replace(/\bprovisorio\b/g, "provisório")
    .replace(/\borgao\b/g, "órgão")
    .replace(/\bpublicacao\b/g, "publicação");

  return corrected
    .split(" ")
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && smallWords.has(word)) return word;
      return `${word.charAt(0).toLocaleUpperCase("pt-BR")}${word.slice(1)}`;
    })
    .join(" ");
}

export function humanizeSentence(value: string) {
  const titleized = humanizeIdentifier(value);
  if (!titleized) return titleized;
  return `${titleized.charAt(0).toLocaleUpperCase("pt-BR")}${titleized.slice(1)}`;
}

export function ensureSentence(value: string) {
  const normalized = value.trim();
  if (!normalized) return normalized;
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function findPublicUrl(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;

  const candidateKeys = [
    "url",
    "link",
    "href",
    "uri",
    "documentoUrl",
    "pdfUrl",
    "visualizacaoUrl",
    "consultaUrl",
    "endereco",
  ];

  for (const key of candidateKeys) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  for (const value of Object.values(input as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedUrl = findPublicUrl(item);
        if (nestedUrl) return nestedUrl;
      }
      continue;
    }

    if (value && typeof value === "object") {
      const nestedUrl = findPublicUrl(value);
      if (nestedUrl) return nestedUrl;
    }
  }

  return null;
}

export function extractPublicSourceUrl(rawPayload?: string | null) {
  const parsed = safeJsonParse<unknown>(rawPayload);
  return findPublicUrl(parsed);
}

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

export function summarizeText(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

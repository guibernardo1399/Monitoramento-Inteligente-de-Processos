const STATE_ALIASES: Record<string, string> = {
  "01": "api_publica_tjac",
  "02": "api_publica_tjal",
  "03": "api_publica_tjam",
  "04": "api_publica_tjap",
  "05": "api_publica_tjba",
  "06": "api_publica_tjce",
  "07": "api_publica_tjdft",
  "08": "api_publica_tjes",
  "09": "api_publica_tjgo",
  "10": "api_publica_tjma",
  "11": "api_publica_tjmt",
  "12": "api_publica_tjms",
  "13": "api_publica_tjmg",
  "14": "api_publica_tjpa",
  "15": "api_publica_tjpb",
  "16": "api_publica_tjpr",
  "17": "api_publica_tjpe",
  "18": "api_publica_tjpi",
  "19": "api_publica_tjrj",
  "20": "api_publica_tjrn",
  "21": "api_publica_tjrs",
  "22": "api_publica_tjro",
  "23": "api_publica_tjrr",
  "24": "api_publica_tjsc",
  "25": "api_publica_tjse",
  "26": "api_publica_tjsp",
  "27": "api_publica_tjto",
};

export function normalizeCnjNumber(cnjNumber: string) {
  return cnjNumber.replace(/\D/g, "");
}

export function resolveDatajudAlias(cnjNumber: string, forcedAlias?: string) {
  if (forcedAlias) return forcedAlias;

  const digits = normalizeCnjNumber(cnjNumber);
  if (digits.length < 20) return null;

  const justiceSegment = digits.slice(13, 14);
  const tribunalCode = digits.slice(14, 16);

  if (justiceSegment === "8") return STATE_ALIASES[tribunalCode] || null;
  if (justiceSegment === "4") return `api_publica_trf${Number(tribunalCode)}`;
  if (justiceSegment === "5") return `api_publica_trt${Number(tribunalCode)}`;
  if (justiceSegment === "6") return `api_publica_tre-${tribunalCode}`;
  if (justiceSegment === "7") {
    if (tribunalCode === "13") return "api_publica_tjmmg";
    if (tribunalCode === "19") return "api_publica_tjmrs";
    if (tribunalCode === "26") return "api_publica_tjmsp";
  }

  return null;
}

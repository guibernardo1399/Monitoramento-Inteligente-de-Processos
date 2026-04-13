import { subDays, subHours } from "date-fns";
import type { ExternalProcessSnapshot } from "@/connectors/types";

export const mockProcessSnapshots: Record<string, ExternalProcessSnapshot> = {
  "5001682-64.2024.8.26.0100": {
    cnjNumber: "5001682-64.2024.8.26.0100",
    court: "TJSP",
    className: "Procedimento Comum Civel",
    subject: "Rescisao contratual",
    judgingBody: "12a Vara Civel Central",
    externalReference: "TJSP-5001682-64.2024.8.26.0100",
    parties: [
      { name: "Inova Tech Ltda.", role: "Requerente", document: "12.345.678/0001-99" },
      { name: "Servicos Orion S.A.", role: "Requerida", document: "98.765.432/0001-10" },
    ],
    movements: [
      {
        externalId: "mov-1",
        date: subDays(new Date(), 12).toISOString(),
        title: "Distribuicao",
        description: "Processo distribuido automaticamente para a 12a Vara Civel Central.",
      },
      {
        externalId: "mov-2",
        date: subDays(new Date(), 4).toISOString(),
        title: "Conclusos para despacho",
        description: "Autos conclusos ao magistrado para apreciacao de tutela de urgencia.",
      },
      {
        externalId: "mov-3",
        date: subHours(new Date(), 9).toISOString(),
        title: "Juntada de peticao",
        description: "Peticao intermediaria apresentada pela parte autora.",
      },
    ],
    publications: [
      {
        externalId: "pub-1",
        externalReference: "DJEN-pub-1",
        cnjNumber: "5001682-64.2024.8.26.0100",
        publicationDate: subHours(new Date(), 6).toISOString(),
        availabilityDate: subHours(new Date(), 10).toISOString(),
        actType: "Intimacao",
        source: "DJEN",
        court: "TJSP",
        judgingBody: "12a Vara Civel Central",
        title: "Intimacao para manifestacao",
        excerpt: "Fica a parte autora intimada para se manifestar sobre a contestacao apresentada.",
        content:
          "Fica a parte autora intimada para se manifestar sobre a contestacao apresentada, em atencao ao despacho de fls.",
        hasDeadlineHint: true,
      },
    ],
  },
};

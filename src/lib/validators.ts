import { z } from "zod";
import { isValidCNJ } from "@/lib/utils";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido.").max(120, "Informe um e-mail valido."),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres.")
    .max(128, "A senha informada excede o limite permitido."),
});

export const registerSchema = z.object({
  officeName: z.string().min(2, "Informe o nome do escritorio.").max(120, "Nome do escritorio muito longo."),
  name: z.string().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
  email: z.string().email("Informe um e-mail valido.").max(120, "Informe um e-mail valido."),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres.")
    .max(128, "A senha informada excede o limite permitido."),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente.").max(120, "Nome do cliente muito longo."),
  document: z.string().max(40, "Documento muito longo.").optional(),
  notes: z.string().max(2000, "Observacoes muito longas.").optional(),
});

export const processCreateSchema = z.object({
  cnjNumber: z
    .string()
    .refine((value) => isValidCNJ(value), "Numero CNJ invalido."),
  clientId: z.string().min(1, "Selecione um cliente."),
  lawyerName: z.string().max(120, "Nome do advogado muito longo.").optional(),
  lawyerOab: z.string().max(40, "Numero da OAB muito longo.").optional(),
  notes: z.string().max(2000, "Observacoes muito longas.").optional(),
  internalResponsibleId: z.string().optional(),
});

export const alertActionSchema = z.object({
  status: z.enum(["READ", "REVIEWED", "NO_IMPACT"]),
});

export const officeMemberSchema = z.object({
  name: z.string().min(2, "Informe o nome do membro.").max(120, "Nome do membro muito longo."),
  email: z.string().email("Informe um e-mail valido.").max(120, "Informe um e-mail valido."),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres.")
    .max(128, "A senha informada excede o limite permitido."),
});

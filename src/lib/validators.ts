import { z } from "zod";
import { isValidCNJ } from "@/lib/utils";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export const registerSchema = z.object({
  officeName: z.string().min(2, "Informe o nome do escritorio."),
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

export const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente."),
  document: z.string().optional(),
  notes: z.string().optional(),
});

export const processCreateSchema = z.object({
  cnjNumber: z
    .string()
    .refine((value) => isValidCNJ(value), "Numero CNJ invalido."),
  clientId: z.string().min(1, "Selecione um cliente."),
  lawyerName: z.string().optional(),
  lawyerOab: z.string().optional(),
  notes: z.string().optional(),
  internalResponsibleId: z.string().optional(),
});

export const alertActionSchema = z.object({
  status: z.enum(["READ", "REVIEWED", "NO_IMPACT"]),
});

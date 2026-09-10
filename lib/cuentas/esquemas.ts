import { z } from "zod";

export const TIPOS_CUENTA = [
  "efectivo",
  "ahorro",
  "corriente",
  "tarjeta_credito",
  "inversion",
] as const;

export const ETIQUETA_TIPO_CUENTA: Record<
  (typeof TIPOS_CUENTA)[number],
  string
> = {
  efectivo: "Efectivo",
  ahorro: "Ahorro",
  corriente: "Corriente",
  tarjeta_credito: "Tarjeta de crédito",
  inversion: "Inversión",
};

export const esquemaCuenta = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre a la cuenta"),
  tipo: z.enum(TIPOS_CUENTA),
  saldoInicial: z.coerce
    .number()
    .min(0, "El saldo no puede ser negativo")
    .default(0),
  visibilidad: z.enum(["privada", "compartida"]).default("privada"),
});

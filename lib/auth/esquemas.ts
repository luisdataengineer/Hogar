import { z } from "zod";

const correo = z.email("Correo no válido");
const claveNueva = z
  .string()
  .min(6, "La clave debe tener al menos 6 caracteres");

export const esquemaLogin = z.object({
  email: correo,
  clave: z.string().min(1, "Escribe tu clave"),
});

export const esquemaRecuperacion = z.object({
  email: correo,
});

export const esquemaClaveNueva = z.object({
  clave: claveNueva,
});

const registroBase = {
  nombre: z.string().trim().min(1, "Escribe tu nombre"),
  email: correo,
  clave: claveNueva,
};

export const esquemaRegistro = z.discriminatedUnion("modoHogar", [
  z.object({
    ...registroBase,
    modoHogar: z.literal("crear"),
    nombreHogar: z.string().trim().min(1, "Ponle nombre al hogar"),
  }),
  z.object({
    ...registroBase,
    modoHogar: z.literal("unir"),
    codigo: z.string().trim().min(1, "Escribe el código de invitación"),
  }),
]);

export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

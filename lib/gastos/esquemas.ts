import { z } from "zod";

export const esquemaGasto = z.object({
  cuentaId: z.uuid("Elige una cuenta"),
  monto: z.coerce.number().positive("El monto debe ser mayor que cero"),
  descripcion: z.string().trim().max(200, "Descripción muy larga").optional(),
  fecha: z.iso.date("Fecha no válida"),
});

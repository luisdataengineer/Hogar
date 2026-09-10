import { crearClienteServidor } from "@/lib/supabase/server";

export default async function PaginaHogar() {
  const supabase = await crearClienteServidor();

  const { data: hogar } = await supabase
    .from("hogares")
    .select("nombre, codigo_invitacion")
    .single();

  const { data: integrantes } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .order("creado_en", { ascending: true });

  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">{hogar?.nombre}</h1>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="font-medium">Integrantes</h2>
        <ul className="text-muted-foreground">
          {integrantes?.map((p) => (
            <li key={p.id}>{p.nombre}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-border p-4 text-sm">
        <p className="text-muted-foreground">Código de invitación</p>
        <p className="mt-1 font-mono text-base">{hogar?.codigo_invitacion}</p>
        <p className="mt-2 text-muted-foreground">
          Compártelo con la otra persona del hogar para que se una al
          registrarse.
        </p>
      </section>
    </main>
  );
}

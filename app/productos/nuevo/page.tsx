import { LayoutAutenticado } from "@/components/layout-autenticado";
import { FormularioNuevoProducto } from "@/components/formulario-nuevo-producto";
import { listarCategorias } from "@/lib/actions/catalogo";

export default async function NuevoProductoPage() {
  const categorias = await listarCategorias();

  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">Catálogo maestro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define un nuevo producto base y su primer lote de existencias.
        </p>
      </div>
      <FormularioNuevoProducto categoriasIniciales={categorias} />
    </LayoutAutenticado>
  );
}

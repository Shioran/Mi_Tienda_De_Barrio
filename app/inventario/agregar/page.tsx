import { LayoutAutenticado } from "@/components/layout-autenticado";
import { FormularioReabastecimiento } from "@/components/formulario-reabastecimiento";
import { listarCategorias } from "@/lib/actions/catalogo";

export default async function AgregarInventarioPage() {
  const categorias = await listarCategorias();

  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Reabastecimiento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa un nuevo lote para un producto que ya existe en el catálogo.
        </p>
      </div>
      <FormularioReabastecimiento categoriasIniciales={categorias} />
    </LayoutAutenticado>
  );
}

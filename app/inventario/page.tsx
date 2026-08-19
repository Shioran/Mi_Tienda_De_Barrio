import { LayoutAutenticado } from "@/components/layout-autenticado";
import { InventarioView } from "@/components/inventario-view";
import { obtenerInventario } from "@/lib/actions/ventas";
import { listarCategorias } from "@/lib/actions/catalogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InventarioPage() {
  const [filas, categorias] = await Promise.all([obtenerInventario(), listarCategorias()]);

  return (
    <LayoutAutenticado>
      <div className="mb-4 rounded-md border-2 border-dashed border-danger bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
        🚧 MARCADOR DE PRUEBA — VERSIÓN NUEVA DEL INVENTARIO — build 2026-08-19 🚧
      </div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          Control de inventario
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{filas.length} productos en catálogo</p>
      </div>
      <InventarioView filas={filas} categoriasIniciales={categorias} />
    </LayoutAutenticado>
  );
}

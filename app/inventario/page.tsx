import Link from "next/link";
import { LayoutAutenticado } from "@/components/layout-autenticado";
import { obtenerInventario } from "@/lib/actions/ventas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFecha } from "@/lib/utils";
import { PackagePlus, Store } from "lucide-react";

const SEMAFORO: Record<string, { label: string; tono: "success" | "warning" | "danger"; emoji: string }> = {
  agotado: { label: "Agotado", tono: "danger", emoji: "🔴" },
  minimo: { label: "Stock mínimo", tono: "warning", emoji: "🟡" },
  rango: { label: "En rango", tono: "success", emoji: "🟢" },
};

export default async function InventarioPage() {
  const filas = await obtenerInventario();

  return (
    <LayoutAutenticado>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Control de inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">{filas.length} productos en catálogo</p>
        </div>
        <div className="flex gap-2">
          <Link href="/productos/nuevo">
            <Button variant="outline">
              <Store size={16} /> Crear producto
            </Button>
          </Link>
          <Link href="/inventario/agregar">
            <Button>
              <PackagePlus size={16} /> Agregar al inventario
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Próx. vencimiento</th>
              <th className="px-4 py-3 font-medium">Últ. reabastecimiento</th>
              <th className="px-4 py-3 font-medium text-right">Disponible</th>
              <th className="px-4 py-3 font-medium text-right">% vendido</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const s = SEMAFORO[f.semaforo];
              return (
                <tr key={f.productoId} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{f.nombre}</p>
                    <p className="text-xs text-muted-foreground">{f.subcategoria}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{f.categoria}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatFecha(f.proximoVencimiento)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatFecha(f.ultimoReabastecimiento)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {f.stockDisponible}
                    <span className="text-muted-foreground"> / {f.stockMaximo}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{f.porcentajeVenta}%</td>
                  <td className="px-4 py-3">
                    <Badge tono={s.tono}>
                      {s.emoji} {s.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {filas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay productos en el catálogo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </LayoutAutenticado>
  );
}

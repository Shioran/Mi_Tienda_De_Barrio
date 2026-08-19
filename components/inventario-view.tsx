"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { formatFecha } from "@/lib/utils";
import { listarSubcategorias } from "@/lib/actions/catalogo";
import type { FilaInventario } from "@/lib/actions/ventas";
import { PackagePlus, Store } from "lucide-react";

type Categoria = { id: string; nombre: string };
type Subcategoria = { id: string; nombre: string };

const SEMAFORO: Record<string, { label: string; tono: "success" | "warning" | "danger"; emoji: string }> = {
  agotado: { label: "Agotado", tono: "danger", emoji: "🔴" },
  minimo: { label: "Stock mínimo", tono: "warning", emoji: "🟡" },
  rango: { label: "En rango", tono: "success", emoji: "🟢" },
};

export function InventarioView({
  filas,
  categoriasIniciales,
}: {
  filas: FilaInventario[];
  categoriasIniciales: Categoria[];
}) {
  const [categorias] = useState(categoriasIniciales);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");

  const categoriaNombre = categorias.find((c) => c.id === categoriaId)?.nombre;

  async function seleccionarCategoria(id: string) {
    setCategoriaId(id);
    setSubcategoriaId("");
    if (!id) {
      setSubcategorias([]);
      return;
    }
    const subs = await listarSubcategorias(id);
    setSubcategorias(subs);
  }

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (categoriaId && f.categoriaId !== categoriaId) return false;
      if (subcategoriaId && f.subcategoriaId !== subcategoriaId) return false;
      return true;
    });
  }, [filas, categoriaId, subcategoriaId]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Select label="Categoría" value={categoriaId} onChange={(e) => seleccionarCategoria(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Subcategoría"
            value={subcategoriaId}
            onChange={(e) => setSubcategoriaId(e.target.value)}
            disabled={!categoriaId}
          >
            <option value="">Todas las subcategorías</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div>
        {categoriaNombre && (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Categoría: <span className="text-foreground">{categoriaNombre}</span>
          </p>
        )}
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Próx. vencimiento</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Últ. reabastecimiento</th>
                <th className="px-4 py-3 font-medium text-right">Disponible</th>
                <th className="hidden px-4 py-3 font-medium text-right sm:table-cell">% vendido</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((f) => {
                const s = SEMAFORO[f.semaforo];
                return (
                  <tr key={f.productoId} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{f.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.categoria} · {f.subcategoria}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatFecha(f.proximoVencimiento)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatFecha(f.ultimoReabastecimiento)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {f.stockDisponible}
                      <span className="text-muted-foreground"> / {f.stockMaximo}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-muted-foreground sm:table-cell">
                      {f.porcentajeVenta}%
                    </td>
                    <td className="px-4 py-3">
                      <Badge tono={s.tono}>
                        {s.emoji} <span className="hidden sm:inline">{s.label}</span>
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {filas.length === 0
                      ? "Todavía no hay productos en el catálogo."
                      : "Ningún producto coincide con este filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/productos/nuevo" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            <Store size={16} /> Crear producto en el inventario
          </Button>
        </Link>
        <Link href="/inventario/agregar" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <PackagePlus size={16} /> Agregar producto al inventario
          </Button>
        </Link>
      </div>
    </div>
  );
}

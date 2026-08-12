"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crearLote, listarCategorias, listarSubcategorias } from "@/lib/actions/catalogo";
import { createClient } from "@/lib/supabase/client";

type Categoria = { id: string; nombre: string };
type Subcategoria = { id: string; nombre: string };
type Producto = {
  id: string;
  nombre: string;
  marca: string;
  tipo: string;
  categoria_id: string;
  subcategoria_id: string;
  vence: boolean;
};

export function FormularioReabastecimiento({ categoriasIniciales }: { categoriasIniciales: Categoria[] }) {
  const router = useRouter();
  const [categorias] = useState(categoriasIniciales);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState("");
  const productoSeleccionado = productos.find((p) => p.id === productoId) ?? null;

  const [numeroLote, setNumeroLote] = useState("");
  const [unidades, setUnidades] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function seleccionarCategoria(id: string) {
    setCategoriaId(id);
    setSubcategoriaId("");
    setProductos([]);
    setProductoId("");
    if (!id) {
      setSubcategorias([]);
      return;
    }
    const subs = await listarSubcategorias(id);
    setSubcategorias(subs);
  }

  useEffect(() => {
    async function cargarProductos() {
      if (!subcategoriaId) {
        setProductos([]);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("productos")
        .select("id, nombre, marca, tipo, categoria_id, subcategoria_id, vence")
        .eq("subcategoria_id", subcategoriaId)
        .order("nombre");
      setProductos(data ?? []);
      setProductoId("");
    }
    cargarProductos();
  }, [subcategoriaId]);

  async function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!productoId) {
      setError("Selecciona el producto a reabastecer.");
      return;
    }
    if (productoSeleccionado?.vence && !fechaVencimiento) {
      setError("Este producto vence: indica la fecha de vencimiento del lote.");
      return;
    }

    setEnviando(true);
    const res = await crearLote({
      productoId,
      numeroLote,
      cantInicial: parseInt(unidades, 10),
      fechaVencimiento: productoSeleccionado?.vence ? fechaVencimiento : null,
    });
    setEnviando(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setOk(true);
    setNumeroLote("");
    setUnidades("");
    setFechaVencimiento("");
    router.refresh();
  }

  return (
    <form onSubmit={enviarFormulario} className="grid grid-cols-2 gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Ubicar producto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Select label="Categoría" value={categoriaId} onChange={(e) => seleccionarCategoria(e.target.value)}>
            <option value="">Selecciona…</option>
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
            <option value="">Selecciona…</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Producto (nombre / marca)"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            disabled={!subcategoriaId}
            required
          >
            <option value="">Selecciona…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tipo} — {p.marca}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Datos del lote</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Input label="N° de lote" value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} required />
          <Input
            label="Unidades"
            type="number"
            min={1}
            value={unidades}
            onChange={(e) => setUnidades(e.target.value)}
            required
          />
          <Input
            label={
              productoSeleccionado
                ? productoSeleccionado.vence
                  ? "Fecha de vencimiento"
                  : "Fecha de vencimiento (no aplica)"
                : "Fecha de vencimiento"
            }
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            disabled={!productoSeleccionado || !productoSeleccionado.vence}
            required={!!productoSeleccionado?.vence}
          />
        </CardContent>
      </Card>

      {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
      {ok && <p className="col-span-2 text-sm text-success">Lote agregado al inventario correctamente.</p>}

      <div className="col-span-2 flex justify-end">
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Agregando…" : "Agregar al inventario"}
        </Button>
      </div>
    </form>
  );
}

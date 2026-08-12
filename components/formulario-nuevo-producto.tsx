"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils";
import { crearCategoria, crearProducto, crearSubcategoria } from "@/lib/actions/catalogo";
import { Plus } from "lucide-react";

type Categoria = { id: string; nombre: string };
type Subcategoria = { id: string; nombre: string };

export function FormularioNuevoProducto({
  categoriasIniciales,
}: {
  categoriasIniciales: Categoria[];
}) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");

  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarNuevaSubcategoria, setMostrarNuevaSubcategoria] = useState(false);
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("");

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [precioCompraMayor, setPrecioCompraMayor] = useState("");
  const [unidadesPaquete, setUnidadesPaquete] = useState("");
  const [precioVentaUni, setPrecioVentaUni] = useState("");
  const [vence, setVence] = useState(true);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [stockMaximo, setStockMaximo] = useState("40");
  const [cantInicial, setCantInicial] = useState("");
  const [numeroLote, setNumeroLote] = useState("L-0001");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costoUnitario = useMemo(() => {
    const mayor = parseFloat(precioCompraMayor);
    const uds = parseFloat(unidadesPaquete);
    if (!mayor || !uds) return 0;
    return mayor / uds;
  }, [precioCompraMayor, unidadesPaquete]);

  const utilidadEstimada = useMemo(() => {
    const venta = parseFloat(precioVentaUni) || 0;
    return venta - costoUnitario;
  }, [precioVentaUni, costoUnitario]);

  const margen = useMemo(() => {
    const venta = parseFloat(precioVentaUni) || 0;
    if (!venta) return 0;
    return (utilidadEstimada / venta) * 100;
  }, [utilidadEstimada, precioVentaUni]);

  async function seleccionarCategoria(id: string) {
    setCategoriaId(id);
    setSubcategoriaId("");
    if (!id) {
      setSubcategorias([]);
      return;
    }
    const { listarSubcategorias } = await import("@/lib/actions/catalogo");
    const subs = await listarSubcategorias(id);
    setSubcategorias(subs);
  }

  async function guardarNuevaCategoria() {
    if (!nuevaCategoria.trim()) return;
    const res = await crearCategoria(nuevaCategoria.trim());
    if (res.data) {
      setCategorias((prev) => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      await seleccionarCategoria(res.data.id);
      setNuevaCategoria("");
      setMostrarNuevaCategoria(false);
    } else {
      setError(res.error ?? "No se pudo crear la categoría");
    }
  }

  async function guardarNuevaSubcategoria() {
    if (!nuevaSubcategoria.trim() || !categoriaId) return;
    const res = await crearSubcategoria(categoriaId, nuevaSubcategoria.trim());
    if (res.data) {
      setSubcategorias((prev) => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSubcategoriaId(res.data.id);
      setNuevaSubcategoria("");
      setMostrarNuevaSubcategoria(false);
    } else {
      setError(res.error ?? "No se pudo crear la subcategoría");
    }
  }

  async function enviarFormulario(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoriaId || !subcategoriaId) {
      setError("Selecciona categoría y subcategoría.");
      return;
    }
    if (vence && !fechaVencimiento) {
      setError("Este producto vence: indica la fecha de vencimiento del primer lote.");
      return;
    }

    setEnviando(true);
    const res = await crearProducto({
      nombre: nombre || `${tipo} ${marca}`.trim(),
      categoriaId,
      subcategoriaId,
      tipo,
      marca,
      precioCompraMayor: parseFloat(precioCompraMayor),
      unidadesPaquete: parseInt(unidadesPaquete, 10),
      precioVentaUni: parseFloat(precioVentaUni),
      vence,
      stockMinimo: parseInt(stockMinimo, 10),
      stockMaximo: parseInt(stockMaximo, 10),
      numeroLote,
      cantInicial: parseInt(cantInicial, 10),
      fechaVencimiento: vence ? fechaVencimiento : null,
    });
    setEnviando(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/inventario");
    router.refresh();
  }

  return (
    <form onSubmit={enviarFormulario} className="grid grid-cols-2 gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Categoría</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <Select
              label="Categoría"
              value={categoriaId}
              onChange={(e) => seleccionarCategoria(e.target.value)}
              required
            >
              <option value="">Selecciona…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            {!mostrarNuevaCategoria ? (
              <button
                type="button"
                onClick={() => setMostrarNuevaCategoria(true)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Plus size={14} /> Crear nueva categoría
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Nombre de la categoría"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                />
                <Button type="button" size="sm" onClick={guardarNuevaCategoria}>
                  Crear
                </Button>
              </div>
            )}
          </div>

          <div>
            <Select
              label="Subcategoría"
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              disabled={!categoriaId}
              required
            >
              <option value="">Selecciona…</option>
              {subcategorias.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
            {categoriaId &&
              (!mostrarNuevaSubcategoria ? (
                <button
                  type="button"
                  onClick={() => setMostrarNuevaSubcategoria(true)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Plus size={14} /> Crear nueva subcategoría
                </button>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Nombre de la subcategoría"
                    value={nuevaSubcategoria}
                    onChange={(e) => setNuevaSubcategoria(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={guardarNuevaSubcategoria}>
                    Crear
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Datos del producto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Input label="Tipo (ej: Leche, Detergente)" value={tipo} onChange={(e) => setTipo(e.target.value)} required />
          <Input label="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} required />
          <Input
            label="Nombre del producto (opcional, se arma con tipo + marca)"
            className="col-span-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`${tipo} ${marca}`.trim()}
          />
          <Input
            label="Precio por mayor (del paquete)"
            type="number"
            min={0}
            step="0.01"
            value={precioCompraMayor}
            onChange={(e) => setPrecioCompraMayor(e.target.value)}
            required
          />
          <Input
            label="Unidades por paquete"
            type="number"
            min={1}
            value={unidadesPaquete}
            onChange={(e) => setUnidadesPaquete(e.target.value)}
            required
          />
          <Input
            label="Precio de venta (por unidad)"
            type="number"
            min={0}
            step="0.01"
            value={precioVentaUni}
            onChange={(e) => setPrecioVentaUni(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Utilidad estimada (por unidad)</span>
            <div className="flex h-10 items-center rounded-md border border-border bg-muted px-3 text-sm font-semibold">
              {formatCOP(utilidadEstimada || 0)}{" "}
              <span className="ml-2 font-normal text-muted-foreground">
                ({margen ? margen.toFixed(1) : "0.0"}% margen · costo unit. {formatCOP(costoUnitario || 0)})
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">¿Este producto vence?</span>
            <div className="flex h-10 items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={vence} onChange={() => setVence(true)} /> Sí
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!vence} onChange={() => setVence(false)} /> No
              </label>
            </div>
          </div>
          <Input
            label="Unidades mínimas (alerta stock)"
            type="number"
            min={0}
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
            required
          />
          <Input
            label="Unidades máximas (capacidad objetivo)"
            type="number"
            min={0}
            value={stockMaximo}
            onChange={(e) => setStockMaximo(e.target.value)}
            required
          />
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Primer lote de inventario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Todo producto nuevo entra con su primer lote de existencias.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Input label="N° de lote" value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} required />
          <Input
            label="Unidades iniciales"
            type="number"
            min={1}
            value={cantInicial}
            onChange={(e) => setCantInicial(e.target.value)}
            required
          />
          <Input
            label="Fecha de vencimiento"
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            disabled={!vence}
            required={vence}
          />
        </CardContent>
      </Card>

      {error && <p className="col-span-2 text-sm text-danger">{error}</p>}

      <div className="col-span-2 flex justify-end">
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Creando…" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}

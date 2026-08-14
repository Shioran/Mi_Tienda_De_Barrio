"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils";
import { useCarritoStore } from "@/lib/store/cart";
import { buscarProductosParaVenta, registrarVenta, type ProductoParaVenta } from "@/lib/actions/ventas";
import { Trash2, Search, ShoppingCart } from "lucide-react";

export function PosView() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoParaVenta[]>([]);
  const [buscando, startBusqueda] = useTransition();
  const [productoElegido, setProductoElegido] = useState<ProductoParaVenta | null>(null);
  const [cantidad, setCantidad] = useState("1");
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ventaExitosa, setVentaExitosa] = useState<string | null>(null);

  const { items, agregarItem, quitarItem, cambiarCantidad, vaciar, total } = useCarritoStore();

  function buscar(valor: string) {
    setBusqueda(valor);
    setProductoElegido(null);
    setVentaExitosa(null);
    if (!valor.trim()) {
      setResultados([]);
      return;
    }
    startBusqueda(async () => {
      const data = await buscarProductosParaVenta(valor);
      setResultados(data);
    });
  }

  function agregarAlCarro() {
    if (!productoElegido) return;
    const cant = Math.max(1, parseInt(cantidad, 10) || 1);
    agregarItem(
      {
        productoId: productoElegido.id,
        nombre: productoElegido.nombre,
        marca: productoElegido.marca,
        precioUnitario: productoElegido.precioVentaUni,
        stockDisponible: productoElegido.stockDisponible,
      },
      cant
    );
    setBusqueda("");
    setResultados([]);
    setProductoElegido(null);
    setCantidad("1");
  }

  async function terminarCompra() {
    if (items.length === 0) return;
    setFinalizando(true);
    setError(null);
    const res = await registrarVenta(items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })));
    setFinalizando(false);

    if (res.error) {
      setError(res.error);
      return;
    }
    setVentaExitosa(res.ventaId ?? null);
    vaciar();
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="flex flex-col gap-4 md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Busca el producto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Escribe el nombre del producto…"
                value={busqueda}
                onChange={(e) => buscar(e.target.value)}
                className="pl-9"
              />
            </div>

            {busqueda && (
              <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                {buscando && <p className="p-3 text-sm text-muted-foreground">Buscando…</p>}
                {!buscando && resultados.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Sin resultados con stock disponible.</p>
                )}
                {resultados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProductoElegido(p);
                      setBusqueda(p.nombre);
                      setResultados([]);
                    }}
                    className="flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-left text-sm last:border-0 hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">Stock: {p.stockDisponible}</p>
                    </div>
                    <span className="font-medium">{formatCOP(p.precioVentaUni)}</span>
                  </button>
                ))}
              </div>
            )}

            {productoElegido && (
              <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted p-3">
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium">{productoElegido.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCOP(productoElegido.precioVentaUni)} · stock {productoElegido.stockDisponible}
                  </p>
                </div>
                <Input
                  label="Cantidad"
                  type="number"
                  min={1}
                  max={productoElegido.stockDisponible}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-24"
                />
                <Button type="button" onClick={agregarAlCarro}>
                  Agregar al carro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:col-span-2">
        <Card className="flex-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={18} /> Carrito
            </CardTitle>
            {items.length > 0 && (
              <button
                type="button"
                onClick={vaciar}
                className="text-xs font-medium text-danger hover:underline"
              >
                Vaciar
              </button>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">El carrito está vacío.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <div key={item.productoId} className="flex items-center gap-2 border-b border-border pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatCOP(item.precioUnitario)} c/u</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={item.stockDisponible}
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidad(item.productoId, parseInt(e.target.value, 10) || 1)}
                      className="h-8 w-14 shrink-0 rounded-md border border-border text-center text-sm sm:w-16"
                    />
                    <p className="w-16 shrink-0 text-right text-sm font-medium sm:w-24">
                      {formatCOP(item.precioUnitario * item.cantidad)}
                    </p>
                    <button
                      type="button"
                      onClick={() => quitarItem(item.productoId)}
                      className="shrink-0 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-xl font-semibold">{formatCOP(total())}</span>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            {ventaExitosa && <p className="text-sm text-success">Venta registrada correctamente.</p>}
            <Button size="lg" disabled={items.length === 0 || finalizando} onClick={terminarCompra}>
              {finalizando ? "Procesando…" : "Terminar compra"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

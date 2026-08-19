"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FilaInventario = {
  productoId: string;
  nombre: string;
  categoriaId: string;
  categoria: string;
  subcategoriaId: string;
  subcategoria: string;
  stockDisponible: number;
  stockMinimo: number;
  stockMaximo: number;
  proximoVencimiento: string | null;
  ultimoReabastecimiento: string | null;
  porcentajeVenta: number;
  semaforo: "agotado" | "minimo" | "rango";
};

export async function obtenerInventario(): Promise<FilaInventario[]> {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select(
      "id, nombre, stock_minimo, stock_maximo, categoria_id, subcategoria_id, categorias(nombre), subcategorias(nombre)"
    )
    .order("nombre");

  const { data: lotes } = await supabase
    .from("lotes")
    .select("producto_id, cant_inicial, cant_disponible, fecha_ingreso, fecha_vencimiento");

  if (!productos) return [];

  return productos.map((p: any) => {
    const lotesProducto = (lotes ?? []).filter((l) => l.producto_id === p.id);
    const disponible = lotesProducto.reduce((acc, l) => acc + l.cant_disponible, 0);
    const inicial = lotesProducto.reduce((acc, l) => acc + l.cant_inicial, 0);
    const vendido = inicial - disponible;
    const porcentajeVenta = inicial > 0 ? Math.round((vendido / inicial) * 100) : 0;

    const conVencimiento = lotesProducto
      .filter((l) => l.fecha_vencimiento && l.cant_disponible > 0)
      .sort((a, b) => (a.fecha_vencimiento! < b.fecha_vencimiento! ? -1 : 1));
    const proximoVencimiento = conVencimiento[0]?.fecha_vencimiento ?? null;

    const ultimoReabastecimiento = lotesProducto
      .map((l) => l.fecha_ingreso)
      .sort()
      .at(-1) ?? null;

    let semaforo: FilaInventario["semaforo"] = "rango";
    if (disponible <= 0) semaforo = "agotado";
    else if (disponible <= p.stock_minimo) semaforo = "minimo";

    return {
      productoId: p.id,
      nombre: p.nombre,
      categoriaId: p.categoria_id,
      categoria: p.categorias?.nombre ?? "—",
      subcategoriaId: p.subcategoria_id,
      subcategoria: p.subcategorias?.nombre ?? "—",
      stockDisponible: disponible,
      stockMinimo: p.stock_minimo,
      stockMaximo: p.stock_maximo,
      proximoVencimiento,
      ultimoReabastecimiento,
      porcentajeVenta,
      semaforo,
    };
  });
}

export type ProductoParaVenta = {
  id: string;
  nombre: string;
  marca: string;
  precioVentaUni: number;
  stockDisponible: number;
};

/** Productos con stock > 0 para el buscador de la caja (POS). */
export async function buscarProductosParaVenta(query: string): Promise<ProductoParaVenta[]> {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, marca, precio_venta_uni")
    .ilike("nombre", `%${query.trim()}%`)
    .order("nombre")
    .limit(15);

  if (!productos || productos.length === 0) return [];

  const ids = productos.map((p) => p.id);
  const { data: lotes } = await supabase
    .from("lotes")
    .select("producto_id, cant_disponible")
    .in("producto_id", ids);

  const disponiblePorProducto = new Map<string, number>();
  (lotes ?? []).forEach((l) => {
    disponiblePorProducto.set(l.producto_id, (disponiblePorProducto.get(l.producto_id) ?? 0) + l.cant_disponible);
  });

  return productos
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      marca: p.marca,
      precioVentaUni: Number(p.precio_venta_uni),
      stockDisponible: disponiblePorProducto.get(p.id) ?? 0,
    }))
    .filter((p) => p.stockDisponible > 0);
}

export type ItemVenta = { productoId: string; cantidad: number };

/** Registra la venta ejecutando la función SQL con lógica FEFO (transaccional). */
export async function registrarVenta(items: ItemVenta[]) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("fn_registrar_venta", {
    p_items: items.map((i) => ({ producto_id: i.productoId, cantidad: i.cantidad })),
  });

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  revalidatePath("/reportes");
  revalidatePath("/");
  return { ventaId: data as string };
}

export type VentaDelDia = {
  id: string;
  numero: number;
  hora: string;
  detalle: string;
  total: number;
  utilidad: number;
};

export async function obtenerVentasDeHoy(): Promise<VentaDelDia[]> {
  const supabase = await createClient();

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, fecha_hora, total_venta, utilidad_total")
    .gte("fecha_hora", inicioHoy.toISOString())
    .eq("anulada", false)
    .order("fecha_hora", { ascending: true });

  if (!ventas || ventas.length === 0) return [];

  const ids = ventas.map((v) => v.id);
  const { data: detalles } = await supabase
    .from("detalle_ventas")
    .select("venta_id, cantidad, productos(nombre)")
    .in("venta_id", ids);

  return ventas.map((v, idx) => {
    const items = (detalles ?? []).filter((d: any) => d.venta_id === v.id);
    const detalle = items.map((d: any) => d.productos?.nombre).join(", ");
    return {
      id: v.id,
      numero: idx + 1,
      hora: new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(v.fecha_hora)
      ),
      detalle: detalle || "—",
      total: Number(v.total_venta),
      utilidad: Number(v.utilidad_total),
    };
  });
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function listarCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("id, nombre").order("nombre");
  return data ?? [];
}

export async function listarSubcategorias(categoriaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subcategorias")
    .select("id, nombre")
    .eq("categoria_id", categoriaId)
    .order("nombre");
  return data ?? [];
}

export async function crearCategoria(nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre })
    .select("id, nombre")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/productos/nuevo");
  return { data };
}

export async function crearSubcategoria(categoriaId: string, nombre: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategorias")
    .insert({ categoria_id: categoriaId, nombre })
    .select("id, nombre")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/productos/nuevo");
  return { data };
}

export type NuevoProductoInput = {
  nombre: string;
  categoriaId: string;
  subcategoriaId: string;
  tipo: string;
  marca: string;
  precioCompraMayor: number;
  unidadesPaquete: number;
  precioVentaUni: number;
  vence: boolean;
  stockMinimo: number;
  stockMaximo: number;
  // primer lote (reabastecimiento inicial)
  numeroLote: string;
  cantInicial: number;
  fechaVencimiento: string | null;
};

/** Crea el producto en el catálogo maestro Y su primer lote de inventario. */
export async function crearProducto(input: NuevoProductoInput) {
  const supabase = await createClient();

  const { data: producto, error: errorProducto } = await supabase
    .from("productos")
    .insert({
      nombre: input.nombre,
      categoria_id: input.categoriaId,
      subcategoria_id: input.subcategoriaId,
      tipo: input.tipo,
      marca: input.marca,
      precio_compra_mayor: input.precioCompraMayor,
      unidades_paquete: input.unidadesPaquete,
      precio_venta_uni: input.precioVentaUni,
      vence: input.vence,
      stock_minimo: input.stockMinimo,
      stock_maximo: input.stockMaximo,
    })
    .select("id, costo_unitario")
    .single();

  if (errorProducto) return { error: errorProducto.message };

  const { error: errorLote } = await supabase.from("lotes").insert({
    producto_id: producto.id,
    numero_lote: input.numeroLote || "L-0001",
    precio_compra_mayor: input.precioCompraMayor,
    costo_unitario: producto.costo_unitario,
    cant_inicial: input.cantInicial,
    cant_disponible: input.cantInicial,
    fecha_vencimiento: input.vence ? input.fechaVencimiento : null,
  });

  if (errorLote) return { error: errorLote.message };

  revalidatePath("/inventario");
  revalidatePath("/pos");
  return { data: producto };
}

export type NuevoLoteInput = {
  productoId: string;
  numeroLote: string;
  cantInicial: number;
  fechaVencimiento: string | null;
};

/** Reabastecimiento: agrega un nuevo lote a un producto YA existente en el catálogo. */
export async function crearLote(input: NuevoLoteInput) {
  const supabase = await createClient();

  const { data: producto, error: errorProducto } = await supabase
    .from("productos")
    .select("precio_compra_mayor, costo_unitario, vence")
    .eq("id", input.productoId)
    .single();

  if (errorProducto || !producto) return { error: "Producto no encontrado" };

  const { error } = await supabase.from("lotes").insert({
    producto_id: input.productoId,
    numero_lote: input.numeroLote,
    precio_compra_mayor: producto.precio_compra_mayor,
    costo_unitario: producto.costo_unitario,
    cant_inicial: input.cantInicial,
    cant_disponible: input.cantInicial,
    fecha_vencimiento: producto.vence ? input.fechaVencimiento : null,
  });

  if (error) return { error: error.message };

  revalidatePath("/inventario");
  revalidatePath("/pos");
  return { ok: true };
}

/** Búsqueda de productos para el catálogo maestro / reabastecimiento (con categoría y subcategoría). */
export async function buscarProductos(query: string) {
  const supabase = await createClient();
  let req = supabase
    .from("productos")
    .select("id, nombre, marca, tipo, categoria_id, subcategoria_id, precio_venta_uni, vence")
    .order("nombre")
    .limit(20);

  if (query.trim()) {
    req = req.ilike("nombre", `%${query.trim()}%`);
  }

  const { data } = await req;
  return data ?? [];
}

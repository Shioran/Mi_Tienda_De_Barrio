"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: "propietario" | "admin" | "cajero";
  creadoEn: string;
};

export async function listarUsuarios(): Promise<{ data?: Usuario[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_listar_usuarios");

  if (error) return { error: error.message };

  return {
    data: (data ?? []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      creadoEn: u.creado_en,
    })),
  };
}

/** Solo el propietario puede llamar esto (lo valida también la función SQL). */
export async function actualizarRolUsuario(usuarioId: string, rol: "admin" | "cajero") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_actualizar_rol_usuario", {
    p_usuario_id: usuarioId,
    p_rol: rol,
  });

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

/** Solo el propietario puede llamar esto (lo valida también la función SQL). */
export async function eliminarUsuario(usuarioId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_eliminar_usuario", {
    p_usuario_id: usuarioId,
  });

  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { ok: true };
}

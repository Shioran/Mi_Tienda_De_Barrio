import { LayoutAutenticado } from "@/components/layout-autenticado";
import { UsuariosView } from "@/components/usuarios-view";
import { listarUsuarios } from "@/lib/actions/usuarios";
import { getPerfilActual } from "@/lib/supabase/server";

export default async function UsuariosPage() {
  const perfil = await getPerfilActual();
  const { data: usuarios, error } = await listarUsuarios();

  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra quién tiene acceso completo (admin) y quién solo puede
          registrar ventas (cajero).
        </p>
      </div>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <UsuariosView usuarios={usuarios ?? []} miId={perfil?.id ?? ""} />
      )}
    </LayoutAutenticado>
  );
}

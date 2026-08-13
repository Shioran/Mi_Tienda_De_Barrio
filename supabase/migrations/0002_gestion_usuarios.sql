-- =====================================================================
-- Mi Tienda de Barrio — Gestión de usuarios (registro propio + roles)
-- Ejecutar DESPUÉS de 0001_init.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lista todos los usuarios (perfil + correo) — solo accesible para admin.
-- Se necesita una función security definer porque auth.users no es
-- consultable directamente desde el cliente vía RLS normal.
-- ---------------------------------------------------------------------
create or replace function public.fn_listar_usuarios()
returns table (
  id uuid,
  nombre text,
  email text,
  rol public.rol_usuario,
  creado_en timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if public.fn_mi_rol() <> 'admin' then
    raise exception 'No autorizado';
  end if;

  return query
    select p.id, p.nombre, u.email::text, p.rol, p.creado_en
    from public.perfiles p
    join auth.users u on u.id = p.id
    order by p.creado_en asc;
end;
$$;

grant execute on function public.fn_listar_usuarios() to authenticated;

-- ---------------------------------------------------------------------
-- Cambia el rol de un usuario — solo accesible para admin.
-- Evita que un admin se quite a sí mismo el rol si es el único admin
-- (para no dejar la tienda sin administrador).
-- ---------------------------------------------------------------------
create or replace function public.fn_actualizar_rol_usuario(p_usuario_id uuid, p_rol public.rol_usuario)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_total_admins integer;
begin
  if public.fn_mi_rol() <> 'admin' then
    raise exception 'No autorizado';
  end if;

  if p_usuario_id = auth.uid() and p_rol = 'cajero' then
    select count(*) into v_total_admins from public.perfiles where rol = 'admin';
    if v_total_admins <= 1 then
      raise exception 'No puedes quitarte el rol de administrador: eres el único admin activo.';
    end if;
  end if;

  update public.perfiles set rol = p_rol where id = p_usuario_id;
end;
$$;

grant execute on function public.fn_actualizar_rol_usuario(uuid, public.rol_usuario) to authenticated;

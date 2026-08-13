-- =====================================================================
-- Mi Tienda de Barrio — Políticas y funciones para "propietario"
-- Ejecutar DESPUÉS de 0003_rol_propietario.sql (en una consulta aparte,
-- Postgres exige que un nuevo valor de enum se "confirme" antes de usarse)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. El propietario tiene los mismos permisos operativos que admin
--    (catálogo, subcategorías, lotes) — se actualizan las políticas
--    para aceptar ambos roles.
-- ---------------------------------------------------------------------
drop policy if exists "escritura admin" on public.categorias;
create policy "escritura admin" on public.categorias
  for insert with check (public.fn_mi_rol() in ('admin', 'propietario'));
drop policy if exists "update admin" on public.categorias;
create policy "update admin" on public.categorias
  for update using (public.fn_mi_rol() in ('admin', 'propietario'));

drop policy if exists "escritura admin" on public.subcategorias;
create policy "escritura admin" on public.subcategorias
  for insert with check (public.fn_mi_rol() in ('admin', 'propietario'));
drop policy if exists "update admin" on public.subcategorias;
create policy "update admin" on public.subcategorias
  for update using (public.fn_mi_rol() in ('admin', 'propietario'));

drop policy if exists "escritura admin" on public.productos;
create policy "escritura admin" on public.productos
  for insert with check (public.fn_mi_rol() in ('admin', 'propietario'));
drop policy if exists "update admin" on public.productos;
create policy "update admin" on public.productos
  for update using (public.fn_mi_rol() in ('admin', 'propietario'));

drop policy if exists "escritura admin" on public.lotes;
create policy "escritura admin" on public.lotes
  for insert with check (public.fn_mi_rol() in ('admin', 'propietario'));
drop policy if exists "update admin" on public.lotes;
create policy "update admin" on public.lotes
  for update using (public.fn_mi_rol() in ('admin', 'propietario'));

drop policy if exists "solo admin lee ventas" on public.ventas;
create policy "solo admin lee ventas" on public.ventas
  for select using (public.fn_mi_rol() in ('admin', 'propietario'));
drop policy if exists "solo admin lee detalle" on public.detalle_ventas;
create policy "solo admin lee detalle" on public.detalle_ventas
  for select using (public.fn_mi_rol() in ('admin', 'propietario'));

-- ---------------------------------------------------------------------
-- 2. Gestión de usuarios: SOLO propietario (ya no cualquier admin)
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
  if public.fn_mi_rol() <> 'propietario' then
    raise exception 'No autorizado';
  end if;

  return query
    select p.id, p.nombre, u.email::text, p.rol, p.creado_en
    from public.perfiles p
    join auth.users u on u.id = p.id
    order by p.creado_en asc;
end;
$$;

-- Solo puede asignar 'admin' o 'cajero' (nunca 'propietario' desde la app,
-- y nunca puede tocar a otro propietario).
create or replace function public.fn_actualizar_rol_usuario(p_usuario_id uuid, p_rol public.rol_usuario)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_rol_actual public.rol_usuario;
begin
  if public.fn_mi_rol() <> 'propietario' then
    raise exception 'No autorizado';
  end if;

  if p_rol = 'propietario' then
    raise exception 'El rol de propietario no se puede asignar desde la aplicación.';
  end if;

  select rol into v_rol_actual from public.perfiles where id = p_usuario_id;

  if v_rol_actual = 'propietario' then
    raise exception 'No puedes cambiar el rol del propietario.';
  end if;

  update public.perfiles set rol = p_rol where id = p_usuario_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Eliminar usuario: SOLO propietario, nunca a sí mismo ni a otro
--    propietario. Borra de auth.users (perfiles se borra en cascada).
-- ---------------------------------------------------------------------
create or replace function public.fn_eliminar_usuario(p_usuario_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_rol_actual public.rol_usuario;
begin
  if public.fn_mi_rol() <> 'propietario' then
    raise exception 'No autorizado';
  end if;

  if p_usuario_id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta desde aquí.';
  end if;

  select rol into v_rol_actual from public.perfiles where id = p_usuario_id;

  if v_rol_actual = 'propietario' then
    raise exception 'No puedes eliminar al propietario.';
  end if;

  delete from auth.users where id = p_usuario_id;
end;
$$;

grant execute on function public.fn_listar_usuarios() to authenticated;
grant execute on function public.fn_actualizar_rol_usuario(uuid, public.rol_usuario) to authenticated;
grant execute on function public.fn_eliminar_usuario(uuid) to authenticated;

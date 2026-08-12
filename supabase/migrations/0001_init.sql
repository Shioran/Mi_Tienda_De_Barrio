-- =====================================================================
-- Mi Tienda de Barrio — Esquema inicial (Supabase / PostgreSQL)
-- =====================================================================
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (o con `supabase db push` si usas la CLI de Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensiones
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Roles de usuario (perfiles ligados a auth.users)
-- ---------------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'cajero');

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'cajero',
  creado_en timestamptz not null default now()
);

-- Crea automáticamente un perfil (rol cajero por defecto) cuando se registra un usuario
create or replace function public.fn_crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, rol)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.email), 'cajero');
  return new;
end;
$$;

create trigger trg_crear_perfil_nuevo_usuario
  after insert on auth.users
  for each row execute function public.fn_crear_perfil_nuevo_usuario();

-- Helper: rol del usuario autenticado actual
create or replace function public.fn_mi_rol()
returns public.rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 2. Catálogo: categorías y subcategorías (creables desde el formulario)
-- ---------------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  creado_en timestamptz not null default now()
);

create table public.subcategorias (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias (id) on delete cascade,
  nombre text not null,
  creado_en timestamptz not null default now(),
  unique (categoria_id, nombre)
);

-- ---------------------------------------------------------------------
-- 3. Catálogo maestro de productos
-- ---------------------------------------------------------------------
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria_id uuid not null references public.categorias (id),
  subcategoria_id uuid not null references public.subcategorias (id),
  tipo text not null,
  marca text not null,
  -- Referencia de costo (se actualiza con cada nuevo lote; el costo REAL de
  -- cada venta siempre sale del lote FEFO consumido, esto es solo estimado)
  precio_compra_mayor numeric(12, 2) not null check (precio_compra_mayor >= 0),
  unidades_paquete integer not null check (unidades_paquete > 0),
  costo_unitario numeric(12, 2) generated always as
    (round(precio_compra_mayor / unidades_paquete, 2)) stored,
  precio_venta_uni numeric(12, 2) not null check (precio_venta_uni >= 0),
  utilidad_unitaria numeric(12, 2) generated always as
    (round(precio_venta_uni - (precio_compra_mayor / unidades_paquete), 2)) stored,
  vence boolean not null default true,
  stock_minimo integer not null default 5 check (stock_minimo >= 0),
  stock_maximo integer not null default 50 check (stock_maximo >= 0),
  creado_en timestamptz not null default now(),
  check (stock_maximo >= stock_minimo)
);

create index idx_productos_categoria on public.productos (categoria_id);
create index idx_productos_subcategoria on public.productos (subcategoria_id);
create index idx_productos_nombre on public.productos using gin (to_tsvector('spanish', nombre || ' ' || marca));

-- ---------------------------------------------------------------------
-- 4. Lotes (entradas de inventario) — el primer lote nace junto al producto
-- ---------------------------------------------------------------------
create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  numero_lote text not null,
  precio_compra_mayor numeric(12, 2) not null check (precio_compra_mayor >= 0),
  costo_unitario numeric(12, 2) not null check (costo_unitario >= 0),
  cant_inicial integer not null check (cant_inicial > 0),
  cant_disponible integer not null check (cant_disponible >= 0),
  fecha_ingreso date not null default current_date,
  fecha_vencimiento date, -- null permitido si el producto no vence
  creado_en timestamptz not null default now(),
  check (cant_disponible <= cant_inicial)
);

create index idx_lotes_producto on public.lotes (producto_id);
-- Índice que soporta directamente el orden FEFO (vencimiento próximo primero,
-- sin vencimiento al final, desempatando por fecha de ingreso)
create index idx_lotes_fefo on public.lotes (
  producto_id,
  (fecha_vencimiento is null),
  fecha_vencimiento,
  fecha_ingreso
);

-- ---------------------------------------------------------------------
-- 5. Ventas y detalle
-- ---------------------------------------------------------------------
create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  fecha_hora timestamptz not null default now(),
  total_venta numeric(12, 2) not null default 0,
  utilidad_total numeric(12, 2) not null default 0,
  usuario_id uuid references public.perfiles (id),
  anulada boolean not null default false
);

create index idx_ventas_fecha on public.ventas (fecha_hora);

create table public.detalle_ventas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id) on delete cascade,
  lote_id uuid not null references public.lotes (id),
  producto_id uuid not null references public.productos (id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12, 2) not null,
  costo_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) generated always as (cantidad * precio_unitario) stored
);

create index idx_detalle_ventas_venta on public.detalle_ventas (venta_id);
create index idx_detalle_ventas_producto on public.detalle_ventas (producto_id);

-- ---------------------------------------------------------------------
-- 6. Función transaccional de venta con lógica FEFO
--    (vencimiento más próximo primero; sin vencimiento -> al final,
--    ordenado por fecha de ingreso más antigua)
-- ---------------------------------------------------------------------
-- p_items: [{ "producto_id": "uuid", "cantidad": 3 }, ...]
create or replace function public.fn_registrar_venta(p_items jsonb)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_venta_id uuid;
  v_item record;
  v_lote record;
  v_restante integer;
  v_tomar integer;
  v_total numeric(12,2) := 0;
  v_utilidad numeric(12,2) := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  insert into public.ventas (usuario_id) values (auth.uid())
  returning id into v_venta_id;

  for v_item in
    select
      (elem ->> 'producto_id')::uuid as producto_id,
      (elem ->> 'cantidad')::integer as cantidad
    from jsonb_array_elements(p_items) as elem
  loop
    if v_item.cantidad <= 0 then
      raise exception 'Cantidad inválida para el producto %', v_item.producto_id;
    end if;

    v_restante := v_item.cantidad;

    for v_lote in
      select id, cant_disponible, costo_unitario
      from public.lotes
      where producto_id = v_item.producto_id
        and cant_disponible > 0
      order by (fecha_vencimiento is null) asc, fecha_vencimiento asc, fecha_ingreso asc
      for update
    loop
      exit when v_restante <= 0;

      v_tomar := least(v_restante, v_lote.cant_disponible);

      update public.lotes
        set cant_disponible = cant_disponible - v_tomar
        where id = v_lote.id;

      insert into public.detalle_ventas
        (venta_id, lote_id, producto_id, cantidad, precio_unitario, costo_unitario)
      select
        v_venta_id, v_lote.id, v_item.producto_id, v_tomar,
        p.precio_venta_uni, v_lote.costo_unitario
      from public.productos p where p.id = v_item.producto_id;

      v_total := v_total + (v_tomar * (select precio_venta_uni from public.productos where id = v_item.producto_id));
      v_utilidad := v_utilidad + (v_tomar * ((select precio_venta_uni from public.productos where id = v_item.producto_id) - v_lote.costo_unitario));

      v_restante := v_restante - v_tomar;
    end loop;

    if v_restante > 0 then
      raise exception 'Stock insuficiente para el producto % (faltan % unidades)', v_item.producto_id, v_restante;
    end if;
  end loop;

  update public.ventas
    set total_venta = v_total, utilidad_total = v_utilidad
    where id = v_venta_id;

  return v_venta_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.subcategorias enable row level security;
alter table public.productos enable row level security;
alter table public.lotes enable row level security;
alter table public.ventas enable row level security;
alter table public.detalle_ventas enable row level security;

-- perfiles: cada quien ve su propio perfil; admin ve todos
create policy "ver propio perfil o admin ve todos" on public.perfiles
  for select using (id = auth.uid() or public.fn_mi_rol() = 'admin');

-- categorias / subcategorias / productos / lotes:
-- lectura para cualquier usuario autenticado, escritura solo admin
create policy "lectura autenticados" on public.categorias for select using (auth.uid() is not null);
create policy "escritura admin" on public.categorias for insert with check (public.fn_mi_rol() = 'admin');
create policy "update admin" on public.categorias for update using (public.fn_mi_rol() = 'admin');

create policy "lectura autenticados" on public.subcategorias for select using (auth.uid() is not null);
create policy "escritura admin" on public.subcategorias for insert with check (public.fn_mi_rol() = 'admin');
create policy "update admin" on public.subcategorias for update using (public.fn_mi_rol() = 'admin');

create policy "lectura autenticados" on public.productos for select using (auth.uid() is not null);
create policy "escritura admin" on public.productos for insert with check (public.fn_mi_rol() = 'admin');
create policy "update admin" on public.productos for update using (public.fn_mi_rol() = 'admin');

create policy "lectura autenticados" on public.lotes for select using (auth.uid() is not null);
create policy "escritura admin" on public.lotes for insert with check (public.fn_mi_rol() = 'admin');
create policy "update admin" on public.lotes for update using (public.fn_mi_rol() = 'admin');

-- ventas / detalle_ventas: solo admin puede leer el historial (reportes);
-- la escritura real ocurre dentro de fn_registrar_venta (security definer),
-- así que cajero y admin pueden ejecutar esa función sin necesitar insert directo.
create policy "solo admin lee ventas" on public.ventas for select using (public.fn_mi_rol() = 'admin');
create policy "solo admin lee detalle" on public.detalle_ventas for select using (public.fn_mi_rol() = 'admin');

grant execute on function public.fn_registrar_venta(jsonb) to authenticated;

# Mi Tienda de Barrio — Inventario + Punto de Venta (MVP)

Aplicación web de escritorio para gestionar el catálogo, el inventario por
lotes (FEFO) y la caja de una tienda de barrio.

**Stack:** Next.js 14 (App Router) + TypeScript · Tailwind CSS (componentes
estilo shadcn/ui hechos a mano) · Supabase (Postgres + Auth) · Zustand ·
Vercel.

## 0. Requisitos

- Node.js 18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Elige nombre, contraseña de base de datos y región (Sur América si está disponible). Espera ~2 min a que aprovisione.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

## 2. Ejecutar el esquema SQL

Abre **SQL Editor → New query** en Supabase y ejecuta los archivos de
`supabase/migrations/` **en orden, uno por uno** (dale "Run" a cada uno
antes de pegar el siguiente):

1. `0001_init.sql` — tablas, roles base, RLS y la función `fn_registrar_venta` (FEFO).
2. `0002_gestion_usuarios.sql` — funciones para listar usuarios y cambiar roles.
3. `0003_rol_propietario.sql` — agrega el rol `propietario` al enum de roles.
   **Este archivo debe ejecutarse solo, en su propia consulta**, porque
   Postgres exige confirmar un valor nuevo de enum antes de poder usarlo.
4. `0004_permisos_propietario.sql` — deja la gestión de usuarios (ascender
   admins, eliminar cuentas) exclusivamente en manos del propietario.
5. `seed.sql` — carga el catálogo de ejemplo (48 productos, 5 categorías,
   tomados de `catalogo_productos_base.csv`) con su primer lote de inventario.

Por defecto Supabase pide confirmar el correo antes de poder iniciar sesión.
Si quieres que la gente pueda entrar apenas se registra (sin revisar correo),
ve a **Authentication → Providers → Email** y desactiva "Confirm email".

## 3. Volverte el propietario (dueño único de la tienda)

Hay tres niveles de acceso:

| Rol | Puede |
|---|---|
| **Cajero** | Solo Registrar venta |
| **Administrador** | Todo lo operativo: catálogo, inventario, reportes, precios |
| **Propietario** | Todo lo de administrador, **más** ascender/degradar admins y eliminar usuarios |

Toda cuenta creada desde `/registro` entra como **cajero**. El rol
`propietario` **no se puede asignar desde la app** — a propósito, para que
nadie pueda auto-otorgárselo. Solo tú lo activas una vez, por SQL:

1. Entra a la app y créate una cuenta normal desde `/registro`.
2. En **SQL Editor**, vuélvete propietario ejecutando:
   ```sql
   update public.perfiles set rol = 'propietario' where id =
     (select id from auth.users where email = 'tu_correo@ejemplo.com');
   ```
3. Desde ahí en adelante, **ya no necesitas volver a SQL**: entra a la
   pantalla **Usuarios** (solo visible para ti, el propietario) y usa los
   botones "Hacer admin" / "Quitar admin" o el ícono de basura para
   eliminar cuentas. Un administrador normal **no ve ni puede acceder** a
   esta pantalla — ni por la interfaz ni llamando la función directamente
   (la función SQL valida el rol del que llama, sin importar cómo se
   invoque). Tampoco puedes eliminarte a ti mismo ni cambiarte el rol por
   accidente.

## 4. Configurar el proyecto localmente

```bash
cd Mi_Tienda_De_Barrio
npm install
cp .env.example .env.local
```

Edita `.env.local` con los valores del paso 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 5. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → te redirige a
`/login`. Entra con el correo/contraseña del administrador que creaste.

## 6. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores de `.env.local`.
4. Deploy. Vercel detecta Next.js automáticamente (no requiere configuración
   adicional).

## Cómo funciona la lógica FEFO

Al presionar **Terminar compra**, el frontend envía la lista de productos y
cantidades a la función SQL `fn_registrar_venta`, que corre **dentro de una
sola transacción**:

1. Para cada producto, busca sus lotes con `cant_disponible > 0` ordenados
   por: primero los que sí vencen (fecha más próxima primero), y al final
   los que no vencen (por fecha de ingreso más antigua).
2. Descuenta cantidad lote por lote hasta cubrir lo vendido, usando el
   `costo_unitario` real de cada lote consumido (no un costo promedio).
3. Inserta una fila en `detalle_ventas` por cada lote que participó en la
   venta, y calcula `total_venta` / `utilidad_total` en `ventas`.
4. Si no hay stock suficiente en ningún lote, aborta toda la transacción
   (no se descuenta nada) y devuelve un error.

## Estructura de carpetas

```
app/
  login/page.tsx              Auth (Supabase Auth)
  registro/page.tsx           Autoregistro de nuevos usuarios (rol cajero por defecto)
  page.tsx                    Dashboard principal
  productos/nuevo/page.tsx    Catálogo maestro (crear producto + 1er lote)
  inventario/
    page.tsx                  Control de inventario + semáforo
    agregar/page.tsx          Reabastecimiento (nuevo lote)
  pos/page.tsx                Punto de venta local
  reportes/page.tsx           Cierre del día
  usuarios/page.tsx           Gestión de roles (solo admin)
components/                   UI (estilo shadcn) + vistas cliente
lib/
  supabase/                   Clientes de Supabase (browser/server/middleware)
  actions/                    Server actions (catálogo, inventario, ventas, usuarios)
  store/cart.ts                Zustand: carrito temporal de la caja
supabase/
  migrations/
    0001_init.sql               Esquema completo + RLS + función FEFO
    0002_gestion_usuarios.sql   Funciones para listar usuarios y cambiar roles
    0003_rol_propietario.sql    Agrega el rol "propietario" al enum
    0004_permisos_propietario.sql  Gestión de usuarios exclusiva del propietario
  seed.sql                    Datos de prueba (del CSV de catálogo)
```

## Alcance del MVP (según lo definido)

- Solo escritorio/PC, sin lector de código de barras (búsqueda manual).
- Sin pasarelas de pago ni fiados/crédito.
- Roles: **propietario** (tú — único que gestiona usuarios), **admin**
  (todo lo operativo, incluye editar precios) y **cajero** (solo Registrar venta).
- Separación estricta entre Catálogo Maestro (`productos`) y Entradas de
  Inventario (`lotes`).

## Siguientes pasos sugeridos (fuera del MVP)

- Editar/desactivar productos existentes desde el catálogo.
- Anular una venta (ya existe la columna `ventas.anulada`, falta la acción).
- Exportar el cierre del día a PDF/Excel.
- Códigos de barras y lector físico.

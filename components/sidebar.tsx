"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  ShoppingCart,
  ClipboardList,
  LogOut,
  Store,
  Users,
} from "lucide-react";

const ENLACES_GESTION = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/productos/nuevo", label: "Catálogo maestro", icon: Store },
  { href: "/inventario/agregar", label: "Reabastecimiento", icon: PackagePlus },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/pos", label: "Registrar venta", icon: ShoppingCart },
  { href: "/reportes", label: "Cierre del día", icon: ClipboardList },
];

const ENLACE_USUARIOS = { href: "/usuarios", label: "Usuarios", icon: Users };

const ENLACES_CAJERO = [{ href: "/pos", label: "Registrar venta", icon: ShoppingCart }];

const ETIQUETA_ROL: Record<string, string> = {
  propietario: "Propietario",
  admin: "Administrador",
  cajero: "Cajero",
};

export function Sidebar({
  rol,
  nombre,
}: {
  rol: "propietario" | "admin" | "cajero";
  nombre: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const enlaces =
    rol === "cajero"
      ? ENLACES_CAJERO
      : rol === "propietario"
      ? [...ENLACES_GESTION, ENLACE_USUARIOS]
      : ENLACES_GESTION;

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-primary text-primary-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-lg font-bold text-accent-foreground">
          T
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-tight">Mi Tienda</p>
          <p className="text-xs text-primary-foreground/60">de Barrio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {enlaces.map(({ href, label, icon: Icon }) => {
          const activo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                activo
                  ? "bg-white/10 text-white"
                  : "text-primary-foreground/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium">{nombre}</p>
          <p className="text-xs text-primary-foreground/60">{ETIQUETA_ROL[rol] ?? rol}</p>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

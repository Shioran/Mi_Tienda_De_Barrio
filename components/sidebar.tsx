"use client";

import { useEffect, useState } from "react";
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
  Menu,
  X,
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
  const [abierto, setAbierto] = useState(false);

  const enlaces =
    rol === "cajero"
      ? ENLACES_CAJERO
      : rol === "propietario"
      ? [...ENLACES_GESTION, ENLACE_USUARIOS]
      : ENLACES_GESTION;

  // Cierra el menú móvil automáticamente al navegar a otra pantalla
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Barra superior solo en móvil: logo + botón de menú */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-primary px-4 text-primary-foreground md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">
            T
          </div>
          <p className="font-display text-sm font-semibold leading-tight">Mi Tienda de Barrio</p>
        </div>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-primary-foreground/80 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Fondo oscuro semitransparente al abrir el menú en móvil */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-primary text-primary-foreground transition-transform duration-200 ease-in-out",
          "md:static md:z-auto md:w-60 md:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-lg font-bold text-accent-foreground">
              T
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-tight">Mi Tienda</p>
              <p className="text-xs text-primary-foreground/60">de Barrio</p>
            </div>
          </div>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
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
    </>
  );
}

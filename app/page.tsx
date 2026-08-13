import Link from "next/link";
import { LayoutAutenticado } from "@/components/layout-autenticado";
import { getPerfilActual, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP } from "@/lib/utils";
import { ShoppingCart, Boxes, ClipboardList, Store, ArrowRight, AlertTriangle, Users } from "lucide-react";

const ACCESOS = [
  { href: "/pos", label: "Registrar venta", desc: "Abrir la caja y vender", icon: ShoppingCart, soloGestion: false, soloPropietario: false },
  { href: "/inventario", label: "Inventario", desc: "Ver stock y vencimientos", icon: Boxes, soloGestion: true, soloPropietario: false },
  { href: "/reportes", label: "Cierre del día", desc: "Ventas de hoy y utilidad", icon: ClipboardList, soloGestion: true, soloPropietario: false },
  { href: "/productos/nuevo", label: "Catálogo maestro", desc: "Crear un nuevo producto", icon: Store, soloGestion: true, soloPropietario: false },
  { href: "/usuarios", label: "Usuarios", desc: "Ascender admins o eliminar cuentas", icon: Users, soloGestion: true, soloPropietario: true },
];

export default async function DashboardPage() {
  const perfil = await getPerfilActual();
  const supabase = await createClient();

  let totalProductos = 0;
  let stockBajo = 0;
  let ventasHoy = 0;
  let totalHoy = 0;

  const puedeGestionar = perfil?.rol === "admin" || perfil?.rol === "propietario";
  const esPropietario = perfil?.rol === "propietario";

  if (puedeGestionar) {
    const { count: cp } = await supabase.from("productos").select("*", { count: "exact", head: true });
    totalProductos = cp ?? 0;

    const { data: lotes } = await supabase
      .from("lotes")
      .select("producto_id, cant_disponible, productos(stock_minimo)");
    const disponiblePorProducto = new Map<string, number>();
    (lotes ?? []).forEach((l: any) => {
      disponiblePorProducto.set(
        l.producto_id,
        (disponiblePorProducto.get(l.producto_id) ?? 0) + l.cant_disponible
      );
    });
    const { data: productos } = await supabase.from("productos").select("id, stock_minimo");
    stockBajo = (productos ?? []).filter(
      (p) => (disponiblePorProducto.get(p.id) ?? 0) <= p.stock_minimo
    ).length;

    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const { data: ventas } = await supabase
      .from("ventas")
      .select("total_venta")
      .gte("fecha_hora", inicioHoy.toISOString());
    ventasHoy = ventas?.length ?? 0;
    totalHoy = (ventas ?? []).reduce((acc, v) => acc + Number(v.total_venta), 0);
  }

  const accesos = ACCESOS.filter(
    (a) => (!a.soloGestion || puedeGestionar) && (!a.soloPropietario || esPropietario)
  );

  return (
    <LayoutAutenticado>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Hola, {perfil?.nombre?.split(" ")[0] ?? "de nuevo"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {puedeGestionar
            ? "Este es el resumen de tu tienda hoy."
            : "Lista para registrar ventas en caja."}
        </p>
      </div>

      {puedeGestionar && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Productos en catálogo</p>
              <p className="mt-1 font-display text-2xl font-semibold">{totalProductos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {stockBajo > 0 && <AlertTriangle size={14} className="text-warning" />}
                Productos en stock mínimo o agotados
              </div>
              <p className="mt-1 font-display text-2xl font-semibold">{stockBajo}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">Ventas de hoy</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {ventasHoy} · {formatCOP(totalHoy)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {accesos.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="group h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon size={22} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-muted-foreground transition-transform group-hover:translate-x-1"
                />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base">{label}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </LayoutAutenticado>
  );
}

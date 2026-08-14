import { LayoutAutenticado } from "@/components/layout-autenticado";
import { obtenerVentasDeHoy } from "@/lib/actions/ventas";
import { CierreDelDia } from "@/components/cierre-del-dia";

export default async function ReportesPage() {
  const ventas = await obtenerVentasDeHoy();
  const totalDia = ventas.reduce((acc, v) => acc + v.total, 0);
  const utilidadDia = ventas.reduce((acc, v) => acc + v.utilidad, 0);

  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">Cierre del día</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial de ventas de hoy y corte de caja.</p>
      </div>
      <CierreDelDia ventas={ventas} totalDia={totalDia} utilidadDia={utilidadDia} />
    </LayoutAutenticado>
  );
}

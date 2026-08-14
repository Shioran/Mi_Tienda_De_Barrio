"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/utils";
import type { VentaDelDia } from "@/lib/actions/ventas";
import { ClipboardCheck } from "lucide-react";

export function CierreDelDia({
  ventas,
  totalDia,
  utilidadDia,
}: {
  ventas: VentaDelDia[];
  totalDia: number;
  utilidadDia: number;
}) {
  const [corteHecho, setCorteHecho] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">N° venta</th>
              <th className="px-4 py-3 font-medium">Hora</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">#{v.numero}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.hora}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.detalle}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCOP(v.total)}</td>
              </tr>
            ))}
            {ventas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay ventas registradas hoy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-8">
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">Total vendido hoy</p>
            <p className="font-display text-base font-semibold sm:text-xl">{formatCOP(totalDia)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">Utilidad del día</p>
            <p className="font-display text-base font-semibold text-success sm:text-xl">
              {formatCOP(utilidadDia)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">N° de ventas</p>
            <p className="font-display text-base font-semibold sm:text-xl">{ventas.length}</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => setCorteHecho(true)}
          disabled={corteHecho || ventas.length === 0}
          className="w-full sm:w-auto"
        >
          <ClipboardCheck size={18} />
          {corteHecho ? "Corte realizado" : "Hacer corte"}
        </Button>
      </Card>
      {corteHecho && (
        <p className="text-sm text-muted-foreground">
          Corte confirmado: {formatCOP(totalDia)} en ventas y {formatCOP(utilidadDia)} de utilidad el día de hoy.
        </p>
      )}
    </div>
  );
}

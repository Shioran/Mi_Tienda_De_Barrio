import { LayoutAutenticado } from "@/components/layout-autenticado";
import { PosView } from "@/components/pos-view";

export default function PosPage() {
  return (
    <LayoutAutenticado>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">Registrar venta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca el producto, agrégalo al carro y termina la compra. El descuento de
          inventario usa siempre el lote más próximo a vencer (FEFO).
        </p>
      </div>
      <PosView />
    </LayoutAutenticado>
  );
}

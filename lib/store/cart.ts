import { create } from "zustand";

export type ItemCarrito = {
  productoId: string;
  nombre: string;
  marca: string;
  precioUnitario: number;
  cantidad: number;
  stockDisponible: number;
};

type EstadoCarrito = {
  items: ItemCarrito[];
  agregarItem: (item: Omit<ItemCarrito, "cantidad">, cantidad: number) => void;
  quitarItem: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
};

export const useCarritoStore = create<EstadoCarrito>((set, get) => ({
  items: [],

  agregarItem: (item, cantidad) =>
    set((state) => {
      const existente = state.items.find((i) => i.productoId === item.productoId);
      if (existente) {
        const nuevaCantidad = Math.min(
          existente.cantidad + cantidad,
          existente.stockDisponible
        );
        return {
          items: state.items.map((i) =>
            i.productoId === item.productoId ? { ...i, cantidad: nuevaCantidad } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { ...item, cantidad: Math.min(cantidad, item.stockDisponible) },
        ],
      };
    }),

  quitarItem: (productoId) =>
    set((state) => ({ items: state.items.filter((i) => i.productoId !== productoId) })),

  cambiarCantidad: (productoId, cantidad) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productoId === productoId
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stockDisponible)) }
          : i
      ),
    })),

  vaciar: () => set({ items: [] }),

  total: () => get().items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0),
}));

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { actualizarRolUsuario, eliminarUsuario, type Usuario } from "@/lib/actions/usuarios";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

export function UsuariosView({ usuarios, miId }: { usuarios: Usuario[]; miId: string }) {
  const [lista, setLista] = useState(usuarios);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarRol(usuario: Usuario) {
    const nuevoRol = usuario.rol === "admin" ? "cajero" : "admin";
    setCambiando(usuario.id);
    setError(null);

    const res = await actualizarRolUsuario(usuario.id, nuevoRol);
    setCambiando(null);

    if (res.error) {
      setError(res.error);
      return;
    }
    setLista((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, rol: nuevoRol } : u)));
  }

  async function confirmarYEliminar(usuario: Usuario) {
    setEliminando(usuario.id);
    setError(null);

    const res = await eliminarUsuario(usuario.id);
    setEliminando(null);
    setConfirmarEliminar(null);

    if (res.error) {
      setError(res.error);
      return;
    }
    setLista((prev) => prev.filter((u) => u.id !== usuario.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Solo el propietario de la tienda puede ascender/degradar administradores
        o eliminar usuarios. Esta pantalla solo es visible para el propietario.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => {
              const esPropietario = u.rol === "propietario";
              const esYo = u.id === miId;
              return (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    {u.nombre} {esYo && <span className="text-xs text-muted-foreground">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge tono={esPropietario ? "warning" : u.rol === "admin" ? "success" : "neutral"}>
                      {esPropietario ? "Propietario" : u.rol === "admin" ? "Administrador" : "Cajero"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {esPropietario ? (
                      <p className="text-right text-xs text-muted-foreground">Cuenta protegida</p>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cambiando === u.id}
                          onClick={() => cambiarRol(u)}
                        >
                          {u.rol === "admin" ? (
                            <>
                              <ShieldOff size={14} /> Quitar admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> Hacer admin
                            </>
                          )}
                        </Button>

                        {confirmarEliminar === u.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-danger">¿Eliminar a {u.nombre}?</span>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={eliminando === u.id}
                              onClick={() => confirmarYEliminar(u)}
                            >
                              Sí, eliminar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmarEliminar(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => setConfirmarEliminar(u.id)}>
                            <Trash2 size={14} className="text-danger" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);

    if (error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent font-display text-2xl font-bold text-accent-foreground">
            T
          </div>
          <CardTitle>Mi Tienda de Barrio</CardTitle>
          <p className="text-sm text-muted-foreground">Ingresa a tu cuenta para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
            <Input
              id="email"
              type="email"
              label="Usuario (correo)"
              placeholder="tienda@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={cargando} className="mt-2 w-full">
              {cargando ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            ¿No tienes cuenta? Pídele al administrador que te registre desde
            Supabase Auth (los nuevos usuarios entran como cajero por defecto).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

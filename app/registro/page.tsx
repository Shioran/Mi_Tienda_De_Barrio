"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);

  async function registrarse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    setCargando(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Ya existe una cuenta con ese correo."
          : "No se pudo crear la cuenta. Intenta de nuevo."
      );
      return;
    }

    // Si el proyecto de Supabase tiene activada la confirmación por correo,
    // signUp no devuelve sesión hasta que el usuario confirme.
    if (!data.session) {
      setRequiereConfirmacion(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (requiereConfirmacion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <CardTitle>Revisa tu correo</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Te enviamos un enlace de confirmación a <strong>{email}</strong>. Ábrelo
            y luego vuelve a{" "}
            <Link href="/login" className="text-primary underline">
              iniciar sesión
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent font-display text-2xl font-bold text-accent-foreground">
            T
          </div>
          <CardTitle>Crear cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tu cuenta empieza con acceso de cajero (Registrar venta).
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={registrarse} className="flex flex-col gap-4">
            <Input
              id="nombre"
              label="Nombre completo"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              label="Correo"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={cargando} className="mt-2 w-full">
              {cargando ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

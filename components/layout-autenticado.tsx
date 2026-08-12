import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export async function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar rol={perfil.rol} nombre={perfil.nombre} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

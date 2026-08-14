import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export async function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const perfil = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <Sidebar rol={perfil.rol} nombre={perfil.nombre} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

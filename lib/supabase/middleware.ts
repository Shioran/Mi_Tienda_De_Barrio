import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieParaEscribir = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieParaEscribir[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esRutaPublica =
    path.startsWith("/login") ||
    path.startsWith("/registro") ||
    path.startsWith("/_next") ||
    path.startsWith("/api");

  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = perfil?.rol;
    const esCajero = rol === "cajero";
    const esPropietario = rol === "propietario";
    const rutasSoloGestion = ["/productos", "/inventario", "/reportes"];
    const rutasSoloPropietario = ["/usuarios"];

    if (esCajero && rutasSoloGestion.some((r) => path.startsWith(r))) {
      const url = request.nextUrl.clone();
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    }

    if (!esPropietario && rutasSoloPropietario.some((r) => path.startsWith(r))) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/login") || path.startsWith("/registro")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

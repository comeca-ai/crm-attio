import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Checagem otimista: sem sessão válida, manda para o login.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth");
  const ok = !!(await verifySession(req.cookies.get(SESSION_COOKIE)?.value));
  if (!ok && !isPublic) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (ok && pathname === "/login") return NextResponse.redirect(new URL("/home", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|woff2?)$).*)"],
};

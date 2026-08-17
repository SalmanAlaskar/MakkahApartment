import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  // Ensure every path is locale-prefixed before anything else runs.
  if (!maybeLocale || !isLocale(maybeLocale)) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = maybeLocale;
  const rest = "/" + segments.slice(1).join("/");
  const isAuthRoute = rest.startsWith("/login");
  const authenticated = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!authenticated && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (authenticated && rest.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

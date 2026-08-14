import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { auth } from "@/auth";

// Wrapped with Auth.js's auth() helper (rather than a bare function) because reading the session
// inside Proxy requires the request to be augmented with `.auth` -- next/headers' headers() (what
// a bare `await auth()` call relies on in Server Components) isn't available in Proxy's runtime.
export default auth((request) => {
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

  if (!request.auth?.user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (request.auth?.user && rest.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Auth.js's own routes live under /api/auth and must stay reachable pre-login (the magic-link
// callback hits /api/auth/callback/resend), so API routes are excluded here rather than gated
// by the session check above.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

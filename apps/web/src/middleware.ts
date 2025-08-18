import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_AUTH_PREFIX = "/api/auth";
const NEXT_STATIC_PREFIX = "/_next";
const PUBLIC_PAGES = ["/", "/login", "/invite/:path*"];
const PROTECTED_PAGES = ["/dashboard", "/access", "/operators", "/profiles"];

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const { pathname } = url;

  if (pathname.startsWith(API_AUTH_PREFIX) || pathname.startsWith(NEXT_STATIC_PREFIX)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  const isAuth = !!token;

  if (isAuth && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  }

  const isProtected = PROTECTED_PAGES.some((p) =>
    p.endsWith("*") ? pathname.startsWith(p.slice(0, -1)) : pathname === p
  );
  if (!isAuth && isProtected) {
    const to = new URL("/login", url.origin);
    to.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(to);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/dashboard", "/access", "/operators", "/operators/:path*", "/profiles", "/profiles/:path*", "/invite/:path*"] };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canonicalizeWorkspacePathname } from "@/lib/active-workspace";

/**
 * Forces canonical `/workspace/user/...` URLs for default tenant routes (308).
 * Exceptions: role surfaces, document shells (`invoices`/`bills`), legacy-only roots — see `WORKSPACE_PATH_NO_PREFIX_ROOTS`.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nextPath = canonicalizeWorkspacePathname(pathname);
  if (nextPath == null || nextPath === pathname) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = nextPath;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/workspace/:path*"],
};

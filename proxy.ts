import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);
const localizedDocsPattern = /^\/(?:zh-CN|en|ja)(\/docs(?:\/.*)?$)/;

export default function proxy(request: NextRequest) {
  const localizedDocs = request.nextUrl.pathname.match(localizedDocsPattern);
  if (localizedDocs) {
    const url = request.nextUrl.clone();
    url.pathname = localizedDocs[1];
    return NextResponse.redirect(url);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    "/",
    "/zh-CN",
    "/en",
    "/ja",
    "/zh-CN/docs/:path*",
    "/en/docs/:path*",
    "/ja/docs/:path*",
  ],
};

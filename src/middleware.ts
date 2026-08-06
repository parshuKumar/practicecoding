import { NextResponse, type NextRequest } from 'next/server';

/**
 * Cheap redirect so a signed-out visitor doesn't flash an empty shell.
 * This is a UX convenience, NOT the security boundary — every page and route
 * handler calls getUser()/withAuth() itself.
 */
export function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has('authjs.session-token') || req.cookies.has('__Secure-authjs.session-token');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/sheet/:path*'],
};

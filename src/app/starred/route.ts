import { NextResponse, type NextRequest } from 'next/server';

// Starred is a tab inside /sheet now, not a route. Keeps old bookmarks working.
export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/sheet', req.url));
}

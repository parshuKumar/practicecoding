import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { getUser, type SessionUser } from './auth';

type Ctx = { params: Promise<Record<string, string>> };

/**
 * The only place in the app that knows about NextRequest, sessions and status codes.
 * Every route handler is built from this, so auth cannot be forgotten by accident.
 */
export function withAuth<T>(fn: (user: SessionUser, req: NextRequest, ctx: Ctx) => Promise<T>) {
  return async (req: NextRequest, ctx: Ctx) => {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    try {
      return NextResponse.json({ data: await fn(user, req, ctx) });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json({ error: 'invalid_request', issues: err.issues }, { status: 400 });
      }
      if (err instanceof NotFoundError) {
        return NextResponse.json({ error: 'not_found', detail: err.message }, { status: 404 });
      }
      console.error(err);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
  };
}

export class NotFoundError extends Error {}

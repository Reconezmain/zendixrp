import { NextRequest, NextResponse } from 'next/server';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(request: NextRequest) {
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
    const expectedOrigin = configuredOrigin ? new URL(configuredOrigin).origin : request.nextUrl.origin;
    if (origin && origin !== expectedOrigin) {
      return NextResponse.json({ error: 'Ugyldig request origin' }, { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}

export const config = { matcher: '/api/:path*' };

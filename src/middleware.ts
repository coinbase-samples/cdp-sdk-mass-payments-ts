import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware will run on every request
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: '/:path*',
}; 
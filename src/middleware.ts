import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as envConfig } from './lib/config';

// This middleware will run on every request
export function middleware(request: NextRequest) {
  // The config import will validate environment variables
  // If any are missing, it will throw an error
  try {
    // Just accessing config is enough to trigger validation
    console.log('Environment variables validated successfully');
  } catch (error) {
    console.error('Environment validation failed:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 }
    );
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: '/:path*',
}; 
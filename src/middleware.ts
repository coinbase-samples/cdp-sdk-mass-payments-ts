import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth, withAuth } from 'next-auth/middleware'

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = await getToken({ req })
    
    // If there's no token, return unauthorized
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Add the user's address to the request headers
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-address', token.sub)

    // Continue to the route if authenticated
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

// Configure which routes to protect
export const config = {
  matcher: [
    '/api/account/:path*',
    // Add other protected routes here
  ]
} 
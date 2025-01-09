// // middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// // Middleware function for App Router
// export function middleware(request: NextRequest) {
//   // Example: Add headers
//   const response = NextResponse.next()
//   response.headers.set('x-custom-header', 'custom-value')

//   // Example: CORS headers
//   response.headers.set('Access-Control-Allow-Origin', '*')
//   response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
//   response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

//   return response
// }

// // Optional: Configure which routes use this middleware
// export const config = {
//   matcher: '/api/:path*',
// }
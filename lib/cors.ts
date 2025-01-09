// // app/lib/cors.ts
// import { NextRequest, NextResponse } from 'next/server';

// export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';
// type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

// export function withCors(
//   handler: RouteHandler,
//   methods: HttpMethod[] = ['GET']
// ): RouteHandler {
//   return async function corsHandler(req: NextRequest): Promise<NextResponse> {
//     const corsHeaders = {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': methods.join(', '),
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '86400',
//     };

//     // Handle preflight
//     if (req.method === 'OPTIONS') {
//       return NextResponse.json({}, { 
//         status: 204,
//         headers: corsHeaders
//       });
//     }

//     // Handle actual request
//     const response = await handler(req);
    
//     // Create a new response with CORS headers
//     const finalResponse = new NextResponse(response.body, {
//       status: response.status,
//       statusText: response.statusText,
//       headers: {
//         ...corsHeaders,
//         ...(response.headers && Object.fromEntries(response.headers.entries()))
//       },
//     });

//     return finalResponse;
//   };
// }
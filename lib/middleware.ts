// // lib/middleware.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { withCors } from './cors';

// type MiddlewareHandler = (request: NextRequest) => Promise<NextResponse>;

// import { HttpMethod } from './cors';

// export function applyMiddlewares(handler: MiddlewareHandler, methods: HttpMethod[] = ['GET']) {
//     return async function(request: NextRequest) {
//         try {
//             // Apply CORS middleware
//             const corsHandler = withCors(handler, methods);
//             return await corsHandler(request);
            
//             // You can chain more middlewares here like:
//             // const authHandler = withAuth(corsHandler);
//             // const rateLimitHandler = withRateLimit(authHandler);
//             // return await rateLimitHandler(request);
//         } catch (error) {
//             console.error('Error in middleware:', error);
//             return NextResponse.json(
//                 { error: 'Internal Server Error' },
//                 { status: 500 }
//             );
//         }
//     }
// }
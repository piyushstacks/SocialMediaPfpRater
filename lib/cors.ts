import { NextRequest, NextResponse } from 'next/server';

interface Handler {
    (req: NextRequest, res: NextResponse): Promise<NextResponse>;
}

export default function withCors(handler: Handler) {
    return async (req: NextRequest, res: NextResponse): Promise<NextResponse> => {
        res.headers.set('Access-Control-Allow-Credentials', 'true');
        res.headers.set('Access-Control-Allow-Origin', '*'); // Update this to your domain in production
        res.headers.set(
            'Access-Control-Allow-Methods',
            'GET,OPTIONS,PATCH,DELETE,POST,PUT'
        );
        res.headers.set(
            'Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
        );

        if (req.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200 });
        }

        return handler(req, res);
    };
}

import { NextResponse } from 'next/server';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export function corsHeaders() {
    return CORS_HEADERS;
}

export function jsonWithCors(data: any, init?: ResponseInit) {
    return NextResponse.json(data, {
        ...init,
        headers: {
            ...CORS_HEADERS,
            ...(init?.headers || {}),
        },
    });
}

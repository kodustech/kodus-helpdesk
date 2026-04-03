import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';

const publicPaths = ['/sign-in', '/invite', '/api/auth'];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(path + '/'),
    );

    if (isPublicPath) {
        // If user is already authenticated and tries to access sign-in, redirect to dashboard
        if (pathname === '/sign-in' && req.auth) {
            return NextResponse.redirect(new URL('/tickets', req.url));
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!req.auth) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};

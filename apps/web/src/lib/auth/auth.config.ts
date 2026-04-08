import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { api } from '../services/api';

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
const REFRESH_BUFFER = 60; // refresh 1 minute before expiry

// Server-side deduplication: cache refresh promises by refresh token
// This prevents race conditions when multiple jwt callback invocations
// try to refresh the same token simultaneously
const refreshCache = new Map<
    string,
    { promise: Promise<any>; expiresAt: number }
>();

async function refreshAccessToken(token: any) {
    const refreshToken = token.refreshToken as string;
    if (!refreshToken) {
        return { ...token, error: 'RefreshAccessTokenError' };
    }

    // Check if there's already an in-flight refresh for this token
    const cached = refreshCache.get(refreshToken);
    if (cached && Date.now() < cached.expiresAt) {
        try {
            const result = await cached.promise;
            return {
                ...token,
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                accessTokenExpires:
                    Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE,
                error: undefined,
            };
        } catch {
            return { ...token, error: 'RefreshAccessTokenError' };
        }
    }

    // Create new refresh request
    const refreshPromise = api
        .post('/auth/refresh', { refresh_token: refreshToken })
        .then((res) => res.data);

    // Cache for 30 seconds to cover concurrent calls
    refreshCache.set(refreshToken, {
        promise: refreshPromise,
        expiresAt: Date.now() + 30_000,
    });

    try {
        const data = await refreshPromise;
        return {
            ...token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpires:
                Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE,
            error: undefined,
        };
    } catch {
        refreshCache.delete(refreshToken);
        return { ...token, error: 'RefreshAccessTokenError' };
    }
}

export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            id: 'credentials',
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const { data } = await api.post('/auth/login', {
                        email: credentials?.email,
                        password: credentials?.password,
                    });

                    return {
                        id: data.user.uuid,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.user.role,
                        customerId: data.user.customerId,
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                    };
                } catch {
                    return null;
                }
            },
        }),
        Credentials({
            id: 'cloud',
            name: 'cloud',
            credentials: {
                token: { label: 'Token', type: 'text' },
            },
            async authorize(credentials) {
                try {
                    const { data } = await api.post('/auth/cloud', undefined, {
                        headers: {
                            Authorization: `Bearer ${credentials?.token}`,
                        },
                    });

                    return {
                        id: data.user.uuid,
                        email: data.user.email,
                        name: data.user.name,
                        role: data.user.role,
                        customerId: data.user.customerId,
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token,
                    };
                } catch (error: any) {
                    console.error('[cloud-auth] Failed:', error?.response?.data || error?.message || error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Initial sign-in: store tokens and expiry
            if (user) {
                token.uuid = user.id;
                token.email = user.email;
                token.name = user.name;
                token.role = user.role;
                token.customerId = user.customerId;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.accessTokenExpires =
                    Math.floor(Date.now() / 1000) + ACCESS_TOKEN_MAX_AGE;
                return token;
            }

            // Token still valid — return as-is
            const expiresAt = (token.accessTokenExpires as number) || 0;
            if (Math.floor(Date.now() / 1000) < expiresAt - REFRESH_BUFFER) {
                return token;
            }

            // Token expired or about to expire — refresh
            return refreshAccessToken(token);
        },
        async session({ session, token }) {
            session.user.id = token.uuid as string;
            session.user.role = token.role;
            session.user.customerId = token.customerId;
            session.user.accessToken = token.accessToken;
            session.user.refreshToken = token.refreshToken;
            if (token.error) {
                session.user.error = token.error;
            }
            return session;
        },
    },
    pages: {
        signIn: '/sign-in',
    },
    session: {
        strategy: 'jwt',
    },
    cookies: {
        sessionToken: {
            name: 'helpdesk.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.WEB_NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: 'helpdesk.callback-url',
            options: {
                sameSite: 'lax',
                path: '/',
                secure: process.env.WEB_NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: 'helpdesk.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.WEB_NODE_ENV === 'production',
            },
        },
    },
};

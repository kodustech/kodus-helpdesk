'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import axios, { type AxiosError } from 'axios';

export function useAuthApi() {
    const { data: session, status, update } = useSession();
    const tokenRef = useRef<string | null>(null);
    const refreshingRef = useRef<Promise<string | null> | null>(null);

    const accessToken = session?.user?.accessToken ?? null;
    const hasError = session?.user?.error === 'RefreshAccessTokenError';

    useEffect(() => {
        tokenRef.current = accessToken;
    }, [accessToken]);

    // If the server-side refresh failed permanently, force logout
    useEffect(() => {
        if (hasError && status === 'authenticated') {
            signOut({ callbackUrl: '/sign-in' });
        }
    }, [hasError, status]);

    const refreshSession = useCallback(async (): Promise<string | null> => {
        if (refreshingRef.current) return refreshingRef.current;

        refreshingRef.current = update()
            .then((updated) => {
                const newToken = updated?.user?.accessToken ?? null;
                const error = updated?.user?.error;

                if (error || !newToken) {
                    return null;
                }

                tokenRef.current = newToken;
                return newToken;
            })
            .catch(() => null)
            .finally(() => {
                refreshingRef.current = null;
            });

        return refreshingRef.current;
    }, [update]);

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL:
                (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003') +
                '/api',
            headers: { 'Content-Type': 'application/json' },
        });

        // Attach token to every request
        instance.interceptors.request.use((config) => {
            const token = tokenRef.current;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // On 401, try ONE refresh then retry
        instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                if (
                    error.response?.status === 401 &&
                    !originalRequest._retried
                ) {
                    originalRequest._retried = true;

                    const newToken = await refreshSession();
                    if (newToken) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return instance.request(originalRequest);
                    }
                    // Refresh failed — don't retry, let the error propagate
                    // The useEffect above will handle logout
                }

                return Promise.reject(error);
            },
        );

        return instance;
    }, [refreshSession]);

    const isReady = status === 'authenticated' && !!accessToken && !hasError;

    return { api, isReady };
}

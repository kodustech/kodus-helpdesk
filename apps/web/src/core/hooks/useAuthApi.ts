'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

export function useAuthApi() {
    const { data: session, status } = useSession();
    const tokenRef = useRef<string | null>(null);

    const accessToken = session?.user?.accessToken ?? null;

    useEffect(() => {
        tokenRef.current = accessToken;
    }, [accessToken]);

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL:
                (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003') +
                '/api',
            headers: { 'Content-Type': 'application/json' },
        });

        instance.interceptors.request.use((config) => {
            const token = tokenRef.current;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return instance;
    }, []);

    const isReady = status === 'authenticated' && !!accessToken;

    return { api, isReady };
}

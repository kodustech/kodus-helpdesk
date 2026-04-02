'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import axios from 'axios';

export function useAuthApi() {
    const { data: session } = useSession();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL:
                (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003') +
                '/api',
            headers: { 'Content-Type': 'application/json' },
        });

        if ((session as any)?.accessToken) {
            instance.defaults.headers.common['Authorization'] =
                `Bearer ${(session as any).accessToken}`;
        }

        return instance;
    }, [(session as any)?.accessToken]);

    return api;
}

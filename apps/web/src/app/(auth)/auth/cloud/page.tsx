'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type CloudAuthStatus = 'waiting' | 'authenticating' | 'success' | 'error';

const ALLOWED_ORIGINS = (
    process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS || 'http://localhost:3000 https://app.kodus.io'
).split(' ');

export default function CloudAuthPage() {
    const router = useRouter();
    const [status, setStatus] = useState<CloudAuthStatus>('waiting');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (!ALLOWED_ORIGINS.includes(event.origin)) return;
            if (event.data?.type !== 'HELPDESK_CLOUD_AUTH') return;

            const token = event.data.token;
            if (!token) return;

            setStatus('authenticating');

            try {
                const result = await signIn('cloud', {
                    token,
                    redirect: false,
                });

                if (result?.error) {
                    setStatus('error');
                    setErrorMessage(
                        'You do not have access to Kodus Helpdesk. Please contact your administrator to request access.',
                    );
                    return;
                }

                setStatus('success');

                // Notify parent that auth succeeded
                if (window.parent !== window) {
                    window.parent.postMessage(
                        { type: 'HELPDESK_CLOUD_AUTH_SUCCESS' },
                        event.origin,
                    );
                }

                router.push('/tickets');
            } catch {
                setStatus('error');
                setErrorMessage(
                    'An unexpected error occurred during authentication. Please try again.',
                );
            }
        };

        window.addEventListener('message', handleMessage);

        // Signal to parent that the iframe is ready to receive the token
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'HELPDESK_CLOUD_AUTH_READY' }, '*');
        }

        return () => window.removeEventListener('message', handleMessage);
    }, [router]);

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <svg
                        className="h-8 w-8 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-xl font-semibold text-white">
                        Access Denied
                    </h1>
                    <p className="max-w-sm text-sm text-text-secondary">
                        {errorMessage}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-transparent" />
            <p className="text-sm text-text-secondary">
                {status === 'waiting'
                    ? 'Connecting to Kodus Helpdesk...'
                    : 'Authenticating...'}
            </p>
        </div>
    );
}

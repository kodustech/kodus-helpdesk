'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/tickets');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="flex w-full flex-col items-center gap-10">
                <h1 className="text-2xl font-bold text-primary-light">
                    Kodus Helpdesk
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-text-primary text-center">
                        Sign in to your account
                    </h2>
                    <p className="text-sm text-text-secondary text-center">
                        Enter your credentials to access the helpdesk
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid w-full gap-6">
                {error && (
                    <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                        <svg
                            className="size-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-primary select-none">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="flex h-12 w-full items-center rounded-xl bg-card-lv2 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        placeholder="you@company.com"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-primary select-none">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="flex h-12 w-full items-center rounded-xl bg-card-lv2 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        placeholder="Enter your password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary-light px-6 py-3 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { clientApi } from '@/lib/services/api';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
    {
        label: 'One special character',
        test: (p: string) => /[^A-Za-z0-9]/.test(p),
    },
];

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const uuid = params.id as string;

    const [inviteData, setInviteData] = useState<{
        email: string;
        customerName: string | null;
    } | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        clientApi
            .get(`/users/invite/${uuid}`)
            .then(({ data }) => setInviteData(data))
            .catch(() => setError('Invite not found or already accepted'))
            .finally(() => setLoadingInvite(false));
    }, [uuid]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const allPassing = PASSWORD_RULES.every((rule) => rule.test(password));
        if (!allPassing) {
            setError('Password does not meet all requirements');
            return;
        }

        setLoading(true);

        try {
            await clientApi.post(`/users/invite/${uuid}/accept`, {
                name,
                password,
                confirm_password: confirmPassword,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'An error occurred. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    if (loadingInvite) {
        return (
            <div className="text-text-secondary text-sm">Loading invite...</div>
        );
    }

    if (success) {
        return (
            <>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                        <svg className="size-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary">
                        Account Created!
                    </h2>
                    <p className="text-sm text-text-secondary text-center">
                        Your account has been set up successfully.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/sign-in')}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary-light px-6 py-3 text-sm font-semibold text-primary-dark transition hover:brightness-120"
                >
                    Sign in
                </button>
            </>
        );
    }

    if (!inviteData) {
        return (
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-semibold text-danger">
                    Invalid Invite
                </h2>
                <p className="text-sm text-text-secondary text-center">
                    {error || 'This invite link is invalid or has expired.'}
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex w-full flex-col items-center gap-10">
                <h1 className="text-2xl font-bold text-primary-light">
                    Kodus Helpdesk
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-semibold text-text-primary text-center">
                        {inviteData.customerName
                            ? `Join ${inviteData.customerName}`
                            : 'Join Kodus Helpdesk'}
                    </h2>
                    <p className="text-sm text-text-secondary text-center">
                        Complete your account setup for {inviteData.email}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid w-full gap-6">
                {error && (
                    <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-primary select-none">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="flex h-12 w-full items-center rounded-xl bg-card-lv2 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        placeholder="Your name"
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
                        placeholder="Create a password"
                    />
                    <div className="mt-2 flex flex-col gap-1.5">
                        {PASSWORD_RULES.map((rule) => (
                            <div
                                key={rule.label}
                                className={`text-[13px] leading-none ${
                                    password && rule.test(password)
                                        ? 'text-success'
                                        : 'text-text-tertiary'
                                }`}
                            >
                                {password && rule.test(password) ? '✓' : '○'}{' '}
                                {rule.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-primary select-none">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="flex h-12 w-full items-center rounded-xl bg-card-lv2 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        placeholder="Confirm your password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1.5 text-[13px] leading-none text-danger">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-primary-light px-6 py-3 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Setting up...' : 'Create Account'}
                </button>
            </form>
        </>
    );
}

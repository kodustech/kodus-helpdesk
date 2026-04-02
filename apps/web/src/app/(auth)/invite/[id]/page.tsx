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
            <div className="rounded-xl bg-card-lv1 p-8 text-center text-text-secondary">
                Loading invite...
            </div>
        );
    }

    if (success) {
        return (
            <div className="rounded-xl bg-card-lv1 p-8 text-center">
                <h2 className="mb-2 text-xl font-bold text-success">
                    Account Created!
                </h2>
                <p className="mb-4 text-text-secondary">
                    Your account has been set up successfully.
                </p>
                <button
                    onClick={() => router.push('/sign-in')}
                    className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-background hover:bg-primary-hover"
                >
                    Sign in
                </button>
            </div>
        );
    }

    if (!inviteData) {
        return (
            <div className="rounded-xl bg-card-lv1 p-8 text-center">
                <h2 className="mb-2 text-xl font-bold text-danger">
                    Invalid Invite
                </h2>
                <p className="text-text-secondary">
                    {error || 'This invite link is invalid or has expired.'}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-card-lv1 p-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-primary">
                    Kodus Helpdesk
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                    {inviteData.customerName
                        ? `You've been invited to join ${inviteData.customerName}`
                        : "You've been invited to join Kodus Helpdesk"}
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                    {inviteData.email}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                        {error}
                    </div>
                )}

                <div>
                    <label className="mb-1 block text-sm text-text-secondary">
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none transition focus:border-input-focus"
                        placeholder="Your name"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-text-secondary">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none transition focus:border-input-focus"
                        placeholder="Create a password"
                    />
                    <div className="mt-2 space-y-1">
                        {PASSWORD_RULES.map((rule) => (
                            <div
                                key={rule.label}
                                className={`text-xs ${
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

                <div>
                    <label className="mb-1 block text-sm text-text-secondary">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none transition focus:border-input-focus"
                        placeholder="Confirm your password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-xs text-danger">
                            Passwords do not match
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-background transition hover:bg-primary-hover disabled:opacity-50"
                >
                    {loading ? 'Setting up...' : 'Create Account'}
                </button>
            </form>
        </div>
    );
}

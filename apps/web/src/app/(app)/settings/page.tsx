'use client';

import { useState } from 'react';
import { useAuthApi } from '@/core/hooks/useAuthApi';

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

export default function SettingsPage() {
    const api = useAuthApi();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const allPassing = PASSWORD_RULES.every((rule) =>
            rule.test(newPassword),
        );
        if (!allPassing) {
            setError('New password does not meet all requirements');
            return;
        }

        setLoading(true);

        try {
            await api.patch('/users/password', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            setSuccess('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to change password',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold">Settings</h1>

            <div className="max-w-md rounded-xl bg-card-lv1 p-6">
                <h2 className="mb-4 text-lg font-semibold">Change Password</h2>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-success/10 p-3 text-sm text-success">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-sm text-text-secondary">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-text-secondary">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                        />
                        <div className="mt-2 space-y-1">
                            {PASSWORD_RULES.map((rule) => (
                                <div
                                    key={rule.label}
                                    className={`text-xs ${
                                        newPassword && rule.test(newPassword)
                                            ? 'text-success'
                                            : 'text-text-tertiary'
                                    }`}
                                >
                                    {newPassword && rule.test(newPassword)
                                        ? '✓'
                                        : '○'}{' '}
                                    {rule.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-text-secondary">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                        />
                        {confirmPassword &&
                            newPassword !== confirmPassword && (
                                <p className="mt-1 text-xs text-danger">
                                    Passwords do not match
                                </p>
                            )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-background hover:bg-primary-hover disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthApi } from '@/core/hooks/useAuthApi';
import { useSession } from 'next-auth/react';

const COMMON_TIMEZONES = [
    'America/New_York',
    'America/Sao_Paulo',
];

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
    const { api } = useAuthApi();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Timezone
    const [timezone, setTimezone] = useState('');
    const [tzLoading, setTzLoading] = useState(false);
    const [tzSuccess, setTzSuccess] = useState('');

    useEffect(() => {
        // Detect browser timezone as default
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTz);
    }, []);

    const handleTimezoneChange = async (tz: string) => {
        setTimezone(tz);
        setTzLoading(true);
        setTzSuccess('');
        try {
            await api.patch('/users/timezone', { timezone: tz });
            setTzSuccess('Timezone updated');
            setTimeout(() => setTzSuccess(''), 3000);
        } catch { }
        setTzLoading(false);
    };

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
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {/* Page Header */}
            <div className="flex w-full max-w-xl min-h-12 shrink-0 items-center gap-6">
                <h1 className="text-2xl font-semibold text-text-primary">
                    Settings
                </h1>
            </div>

            {/* Timezone Card */}
            <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm ring-1 ring-card-lv3">
                <div className="flex flex-col gap-y-1.5 p-6">
                    <h2 className="text-lg font-bold leading-none text-text-primary">
                        Timezone
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Set your timezone for date and time display
                    </p>
                </div>
                <div className="flex flex-col gap-4 p-6 pt-0">
                    <select
                        value={timezone}
                        onChange={(e) => handleTimezoneChange(e.target.value)}
                        disabled={tzLoading}
                        className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition hover:brightness-120 focus:ring-3 focus:brightness-120 disabled:opacity-50"
                    >
                        {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                    {tzSuccess && (
                        <p className="text-sm text-success">{tzSuccess}</p>
                    )}
                </div>
            </div>

            {/* Change Password Card */}
            <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm ring-1 ring-card-lv3">
                <div className="flex flex-col gap-y-1.5 p-6">
                    <h2 className="text-lg font-bold leading-none text-text-primary">
                        Change Password
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Update your account password
                    </p>
                </div>

                <form onSubmit={handleChangePassword} className="flex flex-col gap-6 p-6 pt-0">
                    {error && (
                        <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-4 rounded-xl bg-success/10 p-4 text-sm text-success">
                            {success}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        />
                        <div className="mt-2 flex flex-col gap-1.5">
                            {PASSWORD_RULES.map((rule) => (
                                <div
                                    key={rule.label}
                                    className={`text-[13px] leading-none ${
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

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="mt-1.5 text-[13px] leading-none text-danger">
                                Passwords do not match
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

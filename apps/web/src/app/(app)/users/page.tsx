'use client';

import { useEffect, useState } from 'react';
import { useAuthApi } from '@/core/hooks/useAuthApi';

interface User {
    uuid: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    authType: string;
    customer?: { uuid: string; name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    customer_owner: 'Customer Owner',
    customer_admin: 'Customer Admin',
    customer_editor: 'Customer Editor',
};

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    removed: 'bg-danger/10 text-danger',
};

export default function UsersPage() {
    const { api, isReady } = useAuthApi();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isReady) fetchUsers();
    }, [isReady]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setInviting(true);

        const emails = inviteEmails
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);

        try {
            await api.post('/users/invite', {
                emails,
                role: inviteRole,
            });
            setShowInvite(false);
            setInviteEmails('');
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to invite users');
        } finally {
            setInviting(false);
        }
    };

    return (
        <>
            {/* Page Header */}
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-6">
                <h1 className="text-2xl font-semibold text-text-primary">
                    Users
                </h1>
                <button
                    onClick={() => setShowInvite(true)}
                    className="inline-flex min-h-10 items-center justify-center gap-3 rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120"
                >
                    Invite Users
                </button>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm">
                        <div className="flex flex-col gap-y-1.5 p-6">
                            <h2 className="text-lg font-bold leading-none text-text-primary">
                                Invite Internal Users
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Invite users to the Kodus helpdesk team
                            </p>
                        </div>

                        <form onSubmit={handleInvite} className="flex flex-col gap-6 p-6 pt-0">
                            {error && (
                                <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-text-primary select-none">
                                    Email addresses (comma separated)
                                </label>
                                <textarea
                                    value={inviteEmails}
                                    onChange={(e) => setInviteEmails(e.target.value)}
                                    required
                                    rows={3}
                                    className="flex w-full rounded-xl bg-card-lv1 px-6 py-4 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120 resize-none"
                                    placeholder="user1@kodus.io, user2@kodus.io"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-text-primary select-none">
                                    Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition hover:brightness-120 focus:ring-3 focus:brightness-120"
                                >
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-text-tertiary transition hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {inviting ? 'Inviting...' : 'Send Invites'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users Table */}
            {loading ? (
                <p className="text-sm text-text-secondary">Loading...</p>
            ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-card-lv2 p-12 shadow-sm">
                    <p className="text-sm text-text-secondary">No users found.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-card-lv2 shadow-sm ring-1 ring-card-lv3">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-card-lv3">
                                <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Email</th>
                                <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Name</th>
                                <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Role</th>
                                <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Status</th>
                                <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Customer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.uuid} className="border-b border-card-lv3/50 last:border-0">
                                    <td className="px-6 py-4 text-sm text-text-primary">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">{user.name || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-card-lv3 px-2.5 py-1 text-xs font-medium text-text-primary">
                                            {ROLE_LABELS[user.role] || user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[user.status] || ''}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {user.customer?.name || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

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

const STATUS_COLORS: Record<string, string> = {
    active: 'text-success',
    pending: 'text-warning',
    removed: 'text-danger',
};

export default function UsersPage() {
    const api = useAuthApi();
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
        fetchUsers();
    }, []);

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
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Users</h1>
                <button
                    onClick={() => setShowInvite(true)}
                    className="rounded-lg bg-primary px-4 py-2 font-semibold text-background hover:bg-primary-hover"
                >
                    Invite Users
                </button>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-card-lv1 p-6">
                        <h2 className="mb-4 text-lg font-bold">
                            Invite Internal Users
                        </h2>

                        <form onSubmit={handleInvite} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm text-text-secondary">
                                    Email addresses (comma separated)
                                </label>
                                <textarea
                                    value={inviteEmails}
                                    onChange={(e) =>
                                        setInviteEmails(e.target.value)
                                    }
                                    required
                                    rows={3}
                                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                                    placeholder="user1@kodus.io, user2@kodus.io"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-text-secondary">
                                    Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) =>
                                        setInviteRole(e.target.value)
                                    }
                                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                                >
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-text-secondary hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-background hover:bg-primary-hover disabled:opacity-50"
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
                <p className="text-text-secondary">Loading...</p>
            ) : users.length === 0 ? (
                <div className="rounded-xl bg-card-lv1 p-8 text-center text-text-secondary">
                    No users found.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-card-lv1">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border text-left text-sm text-text-secondary">
                                <th className="px-4 py-3 font-medium">
                                    Email
                                </th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Customer
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.uuid}
                                    className="border-b border-border/50 last:border-0"
                                >
                                    <td className="px-4 py-3 text-sm">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">
                                        {user.name || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-card-lv3 px-2 py-0.5 text-xs">
                                            {ROLE_LABELS[user.role] ||
                                                user.role}
                                        </span>
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-sm ${STATUS_COLORS[user.status] || ''}`}
                                    >
                                        {user.status}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">
                                        {user.customer?.name || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

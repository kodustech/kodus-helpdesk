'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthApi } from '@/core/hooks/useAuthApi';

interface Customer {
    uuid: string;
    name: string;
    site: string | null;
}

interface User {
    uuid: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    authType: string;
}

const ROLE_LABELS: Record<string, string> = {
    customer_owner: 'Owner',
    customer_admin: 'Admin',
    customer_editor: 'Editor',
};

const STATUS_COLORS: Record<string, string> = {
    active: 'text-success',
    pending: 'text-warning',
    removed: 'text-danger',
};

export default function CustomerDetailPage() {
    const params = useParams();
    const uuid = params.uuid as string;
    const api = useAuthApi();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteRole, setInviteRole] = useState('customer_editor');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const [customerRes, usersRes] = await Promise.all([
                api.get(`/customers/${uuid}`),
                api.get('/users'),
            ]);
            setCustomer(customerRes.data);
            // Filter users for this workspace
            setUsers(
                usersRes.data.filter(
                    (u: any) => u.customer?.uuid === uuid,
                ),
            );
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [uuid]);

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
                customer_id: uuid,
            });
            setShowInvite(false);
            setInviteEmails('');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to invite users');
        } finally {
            setInviting(false);
        }
    };

    if (loading) {
        return <p className="text-text-secondary">Loading...</p>;
    }

    if (!customer) {
        return <p className="text-danger">Customer not found</p>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                {customer.site && (
                    <p className="text-text-secondary">{customer.site}</p>
                )}
            </div>

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Users</h2>
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
                            Invite Users
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
                                    placeholder="user1@company.com, user2@company.com"
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
                                    <option value="customer_admin">
                                        Customer Admin
                                    </option>
                                    <option value="customer_editor">
                                        Customer Editor
                                    </option>
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
            {users.length === 0 ? (
                <div className="rounded-xl bg-card-lv1 p-8 text-center text-text-secondary">
                    No users in this workspace yet.
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
                                <th className="px-4 py-3 font-medium">Type</th>
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
                                        {user.authType === 'cloud'
                                            ? 'Cloud'
                                            : 'Local'}
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

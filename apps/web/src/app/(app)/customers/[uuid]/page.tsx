'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthApi } from '@/core/hooks/useAuthApi';

interface Customer {
    uuid: string;
    name: string;
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

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    removed: 'bg-danger/10 text-danger',
};

export default function CustomerDetailPage() {
    const params = useParams();
    const uuid = params.uuid as string;
    const { api, isReady } = useAuthApi();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteRole, setInviteRole] = useState('customer_editor');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');

    // Inline edit customer name
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [customerRes, usersRes] = await Promise.all([
                api.get(`/customers/${uuid}`),
                api.get('/users'),
            ]);
            setCustomer(customerRes.data);
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
        if (isReady) fetchData();
    }, [uuid, isReady]);

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
        return <p className="text-sm text-text-secondary">Loading...</p>;
    }

    const handleSave = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const { data } = await api.patch(`/customers/${uuid}`, {
                name: editName.trim(),
            });
            setCustomer(data);
            setEditing(false);
        } catch {
            // keep editing on error
        } finally {
            setSaving(false);
        }
    };

    if (!customer) {
        return <p className="text-sm text-danger">Customer not found</p>;
    }

    return (
        <>
            {/* Page Header with inline edit */}
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-6">
                {editing ? (
                    <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') setEditing(false);
                        }}
                        className="flex h-12 w-full max-w-md items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition focus:ring-3 focus:brightness-120"
                    />
                ) : (
                    <h1 className="text-2xl font-semibold text-text-primary">
                        {customer.name}
                    </h1>
                )}
                <button
                    onClick={() => {
                        if (editing) {
                            handleSave();
                        } else {
                            setEditName(customer.name);
                            setEditing(true);
                        }
                    }}
                    disabled={saving}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-card-lv2 px-5 py-2.5 text-sm font-semibold text-text-secondary ring-1 ring-card-lv3 transition hover:brightness-120 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? 'Saving...' : editing ? 'Save' : 'Edit'}
                </button>
            </div>

            {/* Users Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-text-primary">
                        Users
                    </h2>
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
                                    Invite Users
                                </h2>
                                <p className="text-sm text-text-secondary">
                                    Invite users to {customer.name}
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
                                        placeholder="user1@company.com, user2@company.com"
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
                                        <option value="customer_admin">Customer Admin</option>
                                        <option value="customer_editor">Customer Editor</option>
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
                {users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-card-lv2 p-12 shadow-sm">
                        <p className="text-sm text-text-secondary">
                            No users in this workspace yet.
                        </p>
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
                                    <th className="px-6 py-3 text-left text-[13px] font-medium text-text-secondary">Type</th>
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
                                            {user.authType === 'cloud' ? 'Cloud' : 'Local'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

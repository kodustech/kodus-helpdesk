'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthApi } from '@/core/hooks/useAuthApi';

interface Customer {
    uuid: string;
    name: string;
    site: string | null;
    createdAt: string;
}

export default function CustomersPage() {
    const api = useAuthApi();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        name: '',
        site: '',
        first_user_email: '',
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const fetchCustomers = async () => {
        try {
            const { data } = await api.get('/customers');
            setCustomers(data);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            await api.post('/customers', form);
            setShowCreate(false);
            setForm({ name: '', site: '', first_user_email: '' });
            fetchCustomers();
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to create customer',
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Customers</h1>
                <button
                    onClick={() => setShowCreate(true)}
                    className="rounded-lg bg-primary px-4 py-2 font-semibold text-background hover:bg-primary-hover"
                >
                    New Customer
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-card-lv1 p-6">
                        <h2 className="mb-4 text-lg font-bold">
                            New Customer
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm text-text-secondary">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                                    placeholder="Company name"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-text-secondary">
                                    Website
                                </label>
                                <input
                                    type="text"
                                    value={form.site}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            site: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                                    placeholder="https://company.com"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-text-secondary">
                                    First User Email (Customer Owner) *
                                </label>
                                <input
                                    type="email"
                                    value={form.first_user_email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            first_user_email: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-text-primary outline-none focus:border-input-focus"
                                    placeholder="user@company.com"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 rounded-lg border border-border px-4 py-2.5 text-text-secondary hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 rounded-lg bg-primary px-4 py-2.5 font-semibold text-background hover:bg-primary-hover disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer List */}
            {loading ? (
                <p className="text-text-secondary">Loading...</p>
            ) : customers.length === 0 ? (
                <div className="rounded-xl bg-card-lv1 p-8 text-center text-text-secondary">
                    No customers yet. Create your first customer to get started.
                </div>
            ) : (
                <div className="space-y-2">
                    {customers.map((customer) => (
                        <Link
                            key={customer.uuid}
                            href={`/customers/${customer.uuid}`}
                            className="flex items-center justify-between rounded-xl bg-card-lv1 p-4 transition hover:bg-card-lv2"
                        >
                            <div>
                                <h3 className="font-medium">
                                    {customer.name}
                                </h3>
                                {customer.site && (
                                    <p className="text-sm text-text-secondary">
                                        {customer.site}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm text-text-tertiary">
                                {new Date(
                                    customer.createdAt,
                                ).toLocaleDateString()}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
import { useAuthApi } from '@/core/hooks/useAuthApi';

interface Customer {
    uuid: string;
    name: string;
    createdAt: string;
}

export default function CustomersPage() {
    const { api, isReady } = useAuthApi();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        name: '',
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
        if (isReady) fetchCustomers();
    }, [isReady]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            await api.post('/customers', form);
            setShowCreate(false);
            setForm({ name: '', first_user_email: '' });
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
        <>
            {/* Page Header */}
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-6">
                <h1 className="text-2xl font-semibold text-text-primary">
                    Customers
                </h1>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex min-h-10 items-center justify-center gap-3 rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120"
                >
                    New Customer
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm">
                        <div className="flex flex-col gap-y-1.5 p-6">
                            <h2 className="text-lg font-bold leading-none text-text-primary">
                                New Customer
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Create a new customer workspace
                            </p>
                        </div>

                        <form onSubmit={handleCreate} className="flex flex-col gap-6 p-6 pt-0">
                            {error && (
                                <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-text-primary select-none">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    required
                                    className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                                    placeholder="Company name"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-text-primary select-none">
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
                                    className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                                    placeholder="user@company.com"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-text-tertiary transition hover:text-text-primary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
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
                <p className="text-sm text-text-secondary">Loading...</p>
            ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-card-lv2 p-12 shadow-sm">
                    <p className="text-sm text-text-secondary">
                        No customers yet. Create your first customer to get started.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {customers.map((customer) => (
                        <Link
                            key={customer.uuid}
                            href={`/customers/${customer.uuid}`}
                            className="flex items-center justify-between rounded-xl bg-card-lv2 p-5 shadow-sm ring-1 ring-card-lv3 transition hover:brightness-120"
                        >
                            <h3 className="text-sm font-semibold text-text-primary">
                                {customer.name}
                            </h3>
                            <span className="text-[13px] text-text-tertiary">
                                {formatDate(customer.createdAt)}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCreateTicket } from '@/core/hooks/useTickets';
import { useAuthApi } from '@/core/hooks/useAuthApi';
import { useQuery } from '@tanstack/react-query';
import { TicketDescriptionEditor } from './editor/TicketDescriptionEditor';
import { CATEGORY_CONFIG } from './constants';
import { Bug, Lightbulb, TrendingUp } from 'lucide-react';

const CATEGORY_ICONS = { bug: Bug, feature: Lightbulb, improvement: TrendingUp } as const;

interface CreateTicketModalProps {
    onClose: () => void;
}

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];

export function CreateTicketModal({ onClose }: CreateTicketModalProps) {
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isCustomer = CUSTOMER_ROLES.includes(role);

    const { api } = useAuthApi();
    const createTicket = useCreateTicket();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState<Record<string, any> | null>(null);
    const [category, setCategory] = useState<string>('bug');
    const [customerId, setCustomerId] = useState('');
    const [error, setError] = useState('');

    // Load customers for management users
    const { data: customers = [] } = useQuery({
        queryKey: ['customers-for-ticket'],
        queryFn: async () => {
            const { data } = await api.get('/customers');
            return data;
        },
        enabled: !isCustomer,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!description) {
            setError('Description is required');
            return;
        }
        if (!isCustomer && !customerId) {
            setError('Please select a customer');
            return;
        }

        try {
            await createTicket.mutateAsync({
                title: title.trim(),
                description,
                category,
                customer_id: isCustomer ? undefined : customerId,
            });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create ticket');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm max-h-[90vh]">
                <div className="flex flex-col gap-y-1.5 p-6">
                    <h2 className="text-lg font-bold leading-none text-text-primary">
                        New Ticket
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Create a new support ticket
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 overflow-y-auto p-6 pt-0"
                >
                    {error && (
                        <div className="flex items-center gap-4 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                            {error}
                        </div>
                    )}

                    {/* Customer selector (management only) */}
                    {!isCustomer && (
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary select-none">
                                Customer *
                            </label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                                className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition hover:brightness-120 focus:ring-3 focus:brightness-120"
                            >
                                <option value="">Select a customer...</option>
                                {customers.map((c: any) => (
                                    <option key={c.uuid} value={c.uuid}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="flex h-12 w-full items-center rounded-xl bg-card-lv1 px-6 text-sm text-text-primary ring-1 ring-card-lv3 transition placeholder:text-text-placeholder/50 hover:brightness-120 focus:ring-3 focus:brightness-120"
                            placeholder="Brief summary of the issue"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Category *
                        </label>
                        <div className="flex gap-2">
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                                const isSelected = category === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setCategory(key)}
                                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 ring-1 transition ${
                                            isSelected
                                                ? 'ring-2 brightness-120'
                                                : 'ring-card-lv3 hover:brightness-120'
                                        }`}
                                        style={
                                            isSelected
                                                ? {
                                                      backgroundColor: `${config.color}15`,
                                                      outlineColor: config.color,
                                                  }
                                                : {}
                                        }
                                    >
                                        <Icon
                                            className="size-5"
                                            style={{ color: config.color }}
                                        />
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: config.color }}
                                        >
                                            {config.label}
                                        </span>
                                        <span className="text-[10px] text-text-tertiary text-center leading-tight">
                                            {config.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Description *
                        </label>
                        <TicketDescriptionEditor
                            content={description}
                            onChange={setDescription}
                            placeholder="Describe the issue in detail..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-text-tertiary transition hover:text-text-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createTicket.isPending}
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

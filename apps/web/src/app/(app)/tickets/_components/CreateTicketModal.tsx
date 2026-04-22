'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCreateTicket } from '@/core/hooks/useTickets';
import { useUploadAttachments } from '@/core/hooks/useAttachments';
import { useAuthApi } from '@/core/hooks/useAuthApi';
import { useQuery } from '@tanstack/react-query';
import { TicketDescriptionEditor } from './editor/TicketDescriptionEditor';
import { CATEGORY_CONFIG } from './constants';
import { Bug, Lightbulb, TrendingUp, Paperclip, X as XIcon, FileText, FileSpreadsheet, FileCode, Image as ImageIcon, File as FileIcon } from 'lucide-react';

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
    const uploadAttachments = useUploadAttachments();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState<Record<string, any> | null>(null);
    const [category, setCategory] = useState<string>('bug');
    const [customerId, setCustomerId] = useState('');
    const [error, setError] = useState('');
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
            const ticket = await createTicket.mutateAsync({
                title: title.trim(),
                description,
                category,
                customer_id: isCustomer ? undefined : customerId,
            });

            // Upload pending files if any
            if (pendingFiles.length > 0) {
                try {
                    await uploadAttachments.mutateAsync({
                        ticketUuid: ticket.uuid,
                        files: pendingFiles,
                    });
                } catch {
                    // Ticket was created, files failed — don't block close
                }
            }

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

                    {/* Attachments */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-text-primary select-none">
                            Attachments
                        </label>
                        <div className="flex flex-col gap-2">
                            {pendingFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {pendingFiles.map((file, idx) => {
                                        const isImg = file.type.startsWith('image/');
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 rounded-lg bg-card-lv1 px-3 py-1.5 ring-1 ring-card-lv3 text-xs"
                                            >
                                                {isImg ? (
                                                    <ImageIcon className="size-3.5 text-text-tertiary" />
                                                ) : file.type === 'application/pdf' || file.type.includes('word') ? (
                                                    <FileText className="size-3.5 text-text-tertiary" />
                                                ) : file.type.includes('excel') || file.type.includes('spreadsheet') || file.type === 'text/csv' ? (
                                                    <FileSpreadsheet className="size-3.5 text-text-tertiary" />
                                                ) : file.type === 'application/json' ? (
                                                    <FileCode className="size-3.5 text-text-tertiary" />
                                                ) : (
                                                    <FileIcon className="size-3.5 text-text-tertiary" />
                                                )}
                                                <span className="max-w-32 truncate text-text-primary">
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPendingFiles((f) =>
                                                            f.filter((_, i) => i !== idx),
                                                        )
                                                    }
                                                    className="text-text-tertiary hover:text-danger transition"
                                                >
                                                    <XIcon className="size-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {pendingFiles.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 rounded-xl bg-card-lv1 px-4 py-2.5 text-sm text-text-secondary ring-1 ring-card-lv3 transition hover:brightness-120"
                                >
                                    <Paperclip className="size-4" />
                                    Add files ({pendingFiles.length}/5)
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        const newFiles = Array.from(e.target.files);
                                        setPendingFiles((prev) => [
                                            ...prev,
                                            ...newFiles,
                                        ].slice(0, 5));
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
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
                            disabled={createTicket.isPending || uploadAttachments.isPending}
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createTicket.isPending
                                ? 'Creating...'
                                : uploadAttachments.isPending
                                  ? 'Uploading files...'
                                  : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

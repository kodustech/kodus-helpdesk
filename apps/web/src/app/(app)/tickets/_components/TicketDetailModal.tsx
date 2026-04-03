'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTicket, useUpdateTicket } from '@/core/hooks/useTickets';
import { TicketDescriptionEditor } from './editor/TicketDescriptionEditor';
import { TicketDetailSidebar } from './TicketDetailSidebar';
import { CommentsSection } from './CommentsSection';
import { X } from 'lucide-react';

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];
const MANAGEMENT_ROLES = ['owner', 'admin', 'editor'];

interface TicketDetailModalProps {
    ticketUuid: string;
    onClose: () => void;
}

export function TicketDetailModal({ ticketUuid, onClose }: TicketDetailModalProps) {
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isManagement = MANAGEMENT_ROLES.includes(role);
    const isCustomer = CUSTOMER_ROLES.includes(role);

    const { data: ticket, isLoading } = useTicket(ticketUuid);
    const updateTicket = useUpdateTicket();

    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');

    if (isLoading || !ticket) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="rounded-xl bg-card-lv2 p-12">
                    <p className="text-sm text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    const canEditDescription =
        (isManagement && ticket.createdBySide === 'management') ||
        (isCustomer && ticket.createdBySide === 'client');

    const handleTitleSave = () => {
        if (titleDraft.trim() && titleDraft.trim() !== ticket.title) {
            updateTicket.mutate({ uuid: ticket.uuid, title: titleDraft.trim() });
        }
        setEditingTitle(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card-lv2 shadow-sm max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-card-lv3 px-6 py-4">
                    <span className="text-xs font-mono text-text-tertiary">
                        {ticket.uuid.slice(0, 8)}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary transition"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left - Content */}
                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                        {/* Title */}
                        {editingTitle ? (
                            <input
                                type="text"
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleTitleSave}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleTitleSave();
                                    if (e.key === 'Escape') setEditingTitle(false);
                                }}
                                autoFocus
                                className="text-xl font-bold text-text-primary bg-transparent border-b-2 border-primary-light outline-none pb-1"
                            />
                        ) : (
                            <h1
                                className="text-xl font-bold text-text-primary cursor-pointer hover:text-primary-light transition"
                                onClick={() => {
                                    setTitleDraft(ticket.title);
                                    setEditingTitle(true);
                                }}
                            >
                                {ticket.title}
                            </h1>
                        )}

                        {/* Description */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                                Description
                            </span>
                            <TicketDescriptionEditor
                                content={ticket.description}
                                onChange={(json) =>
                                    updateTicket.mutate({
                                        uuid: ticket.uuid,
                                        description: json,
                                    })
                                }
                                editable={canEditDescription}
                                placeholder="No description provided"
                            />
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 border-b border-card-lv3">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('comments')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${
                                        activeTab === 'comments'
                                            ? 'border-primary-light text-text-primary'
                                            : 'border-transparent text-text-tertiary hover:text-text-primary'
                                    }`}
                                >
                                    Comments
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('history')}
                                    className={`pb-2 text-sm font-medium transition border-b-2 ${
                                        activeTab === 'history'
                                            ? 'border-primary-light text-text-primary'
                                            : 'border-transparent text-text-tertiary hover:text-text-primary'
                                    }`}
                                >
                                    History
                                </button>
                            </div>

                            {activeTab === 'comments' && (
                                <CommentsSection ticketUuid={ticket.uuid} />
                            )}
                            {activeTab === 'history' && (
                                <p className="text-sm text-text-tertiary">
                                    Activity history coming soon.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right - Sidebar */}
                    <div className="w-72 shrink-0 border-l border-card-lv3 overflow-y-auto p-5">
                        <TicketDetailSidebar ticket={ticket} />
                    </div>
                </div>
            </div>
        </div>
    );
}

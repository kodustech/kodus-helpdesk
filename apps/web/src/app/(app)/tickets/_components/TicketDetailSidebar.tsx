'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthApi } from '@/core/hooks/useAuthApi';
import { useQuery } from '@tanstack/react-query';
import {
    useUpdateTicketStatus,
    useUpdateTicketAssignee,
    useAddTicketLabels,
    useRemoveTicketLabel,
} from '@/core/hooks/useTickets';
import { useLabels, useCreateLabel } from '@/core/hooks/useLabels';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { LabelBadge } from './LabelBadge';
import { STATUS_CONFIG, LABEL_COLORS } from './constants';

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];
const MANAGEMENT_ROLES = ['owner', 'admin', 'editor'];

export function TicketDetailSidebar({ ticket }: { ticket: any }) {
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isManagement = MANAGEMENT_ROLES.includes(role);

    const { api } = useAuthApi();
    const updateStatus = useUpdateTicketStatus();
    const updateAssignee = useUpdateTicketAssignee();
    const addLabels = useAddTicketLabels();
    const removeLabel = useRemoveTicketLabel();
    const { data: allLabels = [] } = useLabels();
    const createLabel = useCreateLabel();

    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    // Load management users for assignee dropdown
    const { data: managementUsers = [] } = useQuery({
        queryKey: ['management-users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data.filter((u: any) => MANAGEMENT_ROLES.includes(u.role));
        },
        enabled: isManagement,
    });

    const ticketLabelIds = (ticket.ticketLabels || []).map((tl: any) => tl.label?.uuid);
    const availableLabels = allLabels.filter(
        (l: any) => !ticketLabelIds.includes(l.uuid),
    );

    const handleCreateAndAddLabel = async () => {
        if (!newLabelName.trim()) return;
        try {
            const label = await createLabel.mutateAsync({
                name: newLabelName.trim(),
                color: newLabelColor,
            });
            await addLabels.mutateAsync({
                uuid: ticket.uuid,
                label_ids: [label.uuid],
            });
            setNewLabelName('');
            setShowLabelPicker(false);
        } catch { }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                </span>
                <select
                    value={ticket.status}
                    onChange={(e) =>
                        updateStatus.mutate({
                            uuid: ticket.uuid,
                            status: e.target.value,
                        })
                    }
                    className="flex h-9 w-full items-center rounded-lg bg-card-lv1 px-3 text-sm text-text-primary ring-1 ring-card-lv3"
                >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>
                            {cfg.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Category
                </span>
                <CategoryBadge category={ticket.category} />
            </div>

            {/* Assignee (management only) */}
            {isManagement && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Assignee
                    </span>
                    <select
                        value={ticket.assignee?.uuid || ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                updateAssignee.mutate({
                                    uuid: ticket.uuid,
                                    assignee_id: e.target.value,
                                });
                            }
                        }}
                        className="flex h-9 w-full items-center rounded-lg bg-card-lv1 px-3 text-sm text-text-primary ring-1 ring-card-lv3"
                    >
                        <option value="">Unassigned</option>
                        {managementUsers.map((u: any) => (
                            <option key={u.uuid} value={u.uuid}>
                                {u.name || u.email}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Labels */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Labels
                </span>
                <div className="flex flex-wrap gap-1">
                    {(ticket.ticketLabels || []).map((tl: any) => (
                        <LabelBadge
                            key={tl.uuid}
                            name={tl.label?.name}
                            color={tl.label?.color}
                            onRemove={
                                isManagement
                                    ? () =>
                                          removeLabel.mutate({
                                              ticketUuid: ticket.uuid,
                                              labelUuid: tl.label?.uuid,
                                          })
                                    : undefined
                            }
                        />
                    ))}
                </div>

                {isManagement && (
                    <>
                        {/* Add existing label */}
                        {availableLabels.length > 0 && (
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        addLabels.mutate({
                                            uuid: ticket.uuid,
                                            label_ids: [e.target.value],
                                        });
                                    }
                                }}
                                className="flex h-8 w-full items-center rounded-lg bg-card-lv1 px-3 text-xs text-text-secondary ring-1 ring-card-lv3"
                            >
                                <option value="">Add label...</option>
                                {availableLabels.map((l: any) => (
                                    <option key={l.uuid} value={l.uuid}>
                                        {l.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Create new label */}
                        {showLabelPicker ? (
                            <div className="flex flex-col gap-2 rounded-lg bg-card-lv1 p-2 ring-1 ring-card-lv3">
                                <input
                                    type="text"
                                    value={newLabelName}
                                    onChange={(e) => setNewLabelName(e.target.value)}
                                    placeholder="Label name"
                                    className="h-7 rounded bg-card-lv2 px-2 text-xs text-text-primary ring-1 ring-card-lv3"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {LABEL_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setNewLabelColor(c)}
                                            className={`size-5 rounded-full transition ${
                                                newLabelColor === c
                                                    ? 'ring-2 ring-white ring-offset-1 ring-offset-card-lv1'
                                                    : ''
                                            }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowLabelPicker(false)}
                                        className="flex-1 rounded bg-card-lv2 px-2 py-1 text-xs text-text-tertiary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateAndAddLabel}
                                        className="flex-1 rounded bg-primary-light px-2 py-1 text-xs font-semibold text-primary-dark"
                                    >
                                        Create
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowLabelPicker(true)}
                                className="text-xs text-text-tertiary hover:text-text-primary transition"
                            >
                                + Create new label
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-card-lv3" />

            {/* Info */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Author
                    </span>
                    <span className="text-sm text-text-primary">
                        {ticket.author?.name || ticket.author?.email || 'Unknown'}
                    </span>
                </div>

                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Customer
                    </span>
                    <span className="text-sm text-text-primary">
                        {ticket.customer?.name || 'Unknown'}
                    </span>
                </div>

                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        Created
                    </span>
                    <span className="text-sm text-text-primary">
                        {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}

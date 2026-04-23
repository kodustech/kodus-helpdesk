'use client';

import { formatRelativeTime } from '@/lib/utils/date';
import { useActivities } from '@/core/hooks/useActivities';
import { STATUS_CONFIG, CATEGORY_CONFIG } from './constants';
import {
    TicketPlus,
    UserCheck,
    ArrowRightLeft,
    Pencil,
    FileText,
    Tag,
    Tags,
    MessageSquarePlus,
    MessageSquareX,
    Layers,
    Upload,
    Trash2,
} from 'lucide-react';

const ACTION_CONFIG: Record<
    string,
    { icon: any; label: string; renderDetail: (m: any) => string }
> = {
    ticket_opened: {
        icon: TicketPlus,
        label: 'opened the ticket',
        renderDetail: () => '',
    },
    ticket_assigned: {
        icon: UserCheck,
        label: 'assigned the ticket',
        renderDetail: (m) => (m?.assignee_name ? `to ${m.assignee_name}` : ''),
    },
    status_changed: {
        icon: ArrowRightLeft,
        label: 'changed the status',
        renderDetail: (m) => {
            const from = STATUS_CONFIG[m?.from as keyof typeof STATUS_CONFIG]?.label || m?.from;
            const to = STATUS_CONFIG[m?.to as keyof typeof STATUS_CONFIG]?.label || m?.to;
            return `from ${from} to ${to}`;
        },
    },
    title_changed: {
        icon: Pencil,
        label: 'changed the title',
        renderDetail: (m) => (m?.from && m?.to ? `from "${m.from}" to "${m.to}"` : ''),
    },
    description_changed: {
        icon: FileText,
        label: 'updated the description',
        renderDetail: () => '',
    },
    category_changed: {
        icon: Layers,
        label: 'changed the category',
        renderDetail: (m) => {
            const from = CATEGORY_CONFIG[m?.from as keyof typeof CATEGORY_CONFIG]?.label || m?.from;
            const to = CATEGORY_CONFIG[m?.to as keyof typeof CATEGORY_CONFIG]?.label || m?.to;
            return `from ${from} to ${to}`;
        },
    },
    labels_added: {
        icon: Tag,
        label: 'added labels',
        renderDetail: (m) => (m?.labels?.length ? m.labels.join(', ') : ''),
    },
    labels_removed: {
        icon: Tags,
        label: 'removed label',
        renderDetail: (m) => (m?.labels?.length ? m.labels.join(', ') : ''),
    },
    comment_added: {
        icon: MessageSquarePlus,
        label: 'added a comment',
        renderDetail: () => '',
    },
    comment_deleted: {
        icon: MessageSquareX,
        label: 'deleted a comment',
        renderDetail: () => '',
    },
    attachment_uploaded: {
        icon: Upload,
        label: 'uploaded files',
        renderDetail: (m) =>
            m?.filenames?.length
                ? m.filenames.join(', ')
                : m?.count
                  ? `${m.count} file(s)`
                  : '',
    },
    attachment_deleted: {
        icon: Trash2,
        label: 'deleted an attachment',
        renderDetail: (m) => m?.filename || '',
    },
};


export function HistoryTab({ ticketUuid }: { ticketUuid: string }) {
    const { data: activities = [], isLoading } = useActivities(ticketUuid);

    if (isLoading) {
        return <p className="text-sm text-text-secondary">Loading history...</p>;
    }

    if (activities.length === 0) {
        return <p className="text-sm text-text-tertiary">No activity recorded yet.</p>;
    }

    return (
        <div className="flex flex-col">
            {activities.map((activity: any, index: number) => {
                const config = ACTION_CONFIG[activity.action] || {
                    icon: Layers,
                    label: activity.action,
                    renderDetail: () => '',
                };
                const Icon = config.icon;
                const detail = config.renderDetail(activity.metadata);
                const actorName =
                    activity.actor?.name || activity.actor?.email || 'Unknown';
                const isLast = index === activities.length - 1;

                return (
                    <div key={activity.uuid} className="flex gap-3">
                        {/* Timeline line + icon */}
                        <div className="flex flex-col items-center">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card-lv3 text-text-secondary">
                                <Icon className="size-3.5" />
                            </div>
                            {!isLast && (
                                <div className="w-px flex-1 bg-card-lv3/50" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-0.5 pb-5">
                            <p className="text-sm text-text-primary">
                                <span className="font-semibold">{actorName}</span>{' '}
                                <span className="text-text-secondary">
                                    {config.label}
                                </span>
                            </p>
                            {detail && (
                                <p className="text-xs text-text-tertiary">
                                    {detail}
                                </p>
                            )}
                            <span className="text-[10px] text-text-tertiary">
                                {formatRelativeTime(activity.createdAt)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

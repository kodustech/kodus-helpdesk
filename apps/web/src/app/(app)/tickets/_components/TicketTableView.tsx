'use client';

import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils/date';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { LabelBadge } from './LabelBadge';

const MANAGEMENT_ROLES = ['owner', 'admin', 'editor'];

interface TicketTableViewProps {
    tickets: any[];
    onSelectTicket: (uuid: string) => void;
}

export function TicketTableView({ tickets, onSelectTicket }: TicketTableViewProps) {
    const { data: session } = useSession();
    const isManagement = MANAGEMENT_ROLES.includes(session?.user?.role || '');

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-card-lv2 p-12 shadow-sm">
                <p className="text-sm text-text-secondary">
                    No tickets found. Create your first ticket to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl bg-card-lv2 shadow-sm ring-1 ring-card-lv3">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-card-lv3">
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Title
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Author
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Assignee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Labels
                        </th>
                        {isManagement && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                                Customer
                            </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Created
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {tickets.map((ticket: any) => (
                        <tr
                            key={ticket.uuid}
                            onClick={() => onSelectTicket(ticket.uuid)}
                            className="border-b border-card-lv3/50 last:border-0 cursor-pointer transition hover:bg-card-lv3/30"
                        >
                            <td className="px-4 py-3 text-sm font-medium text-text-primary max-w-xs truncate">
                                {ticket.title}
                            </td>
                            <td className="px-4 py-3">
                                <CategoryBadge category={ticket.category} />
                            </td>
                            <td className="px-4 py-3">
                                <StatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                                {ticket.author?.name || ticket.author?.email || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-text-secondary">
                                {ticket.assignee?.name || ticket.assignee?.email || '—'}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                    {(ticket.ticketLabels || []).slice(0, 3).map((tl: any) => (
                                        <LabelBadge
                                            key={tl.uuid}
                                            name={tl.label?.name}
                                            color={tl.label?.color}
                                        />
                                    ))}
                                    {(ticket.ticketLabels || []).length > 3 && (
                                        <span className="text-xs text-text-tertiary">
                                            +{ticket.ticketLabels.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>
                            {isManagement && (
                                <td className="px-4 py-3 text-sm text-text-secondary">
                                    {ticket.customer?.name || '—'}
                                </td>
                            )}
                            <td className="px-4 py-3 text-xs text-text-tertiary whitespace-nowrap">
                                {formatDate(ticket.createdAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { LayoutGrid, List } from 'lucide-react';
import { useTickets } from '@/core/hooks/useTickets';
import { useLocalStorage } from '@/core/hooks/useLocalStorage';
import { TicketTableView } from './_components/TicketTableView';
import { TicketKanbanView } from './_components/TicketKanbanView';
import { TicketDetailModal } from './_components/TicketDetailModal';
import { CreateTicketModal } from './_components/CreateTicketModal';
import { CATEGORY_CONFIG, STATUS_CONFIG } from './_components/constants';

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];

export default function TicketsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isCustomer = CUSTOMER_ROLES.includes(role);

    const [viewMode, setViewMode] = useLocalStorage<'kanban' | 'table'>(
        'helpdesk:tickets:viewMode',
        'kanban',
    );
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const { data: tickets = [], isLoading } = useTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
    });

    return (
        <>
            {/* Page Header */}
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-6">
                <h1 className="text-2xl font-semibold text-text-primary">Tickets</h1>
                <div className="flex items-center gap-3">
                    {/* Filters */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex h-9 items-center rounded-lg bg-card-lv2 px-3 text-sm text-text-secondary ring-1 ring-card-lv3"
                    >
                        <option value="">All statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>
                                {cfg.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="flex h-9 items-center rounded-lg bg-card-lv2 px-3 text-sm text-text-secondary ring-1 ring-card-lv3"
                    >
                        <option value="">All categories</option>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>
                                {cfg.label}
                            </option>
                        ))}
                    </select>

                    {/* View toggle */}
                    <div className="flex items-center rounded-lg bg-card-lv2 ring-1 ring-card-lv3">
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`flex h-9 w-9 items-center justify-center rounded-l-lg transition ${
                                viewMode === 'kanban'
                                    ? 'bg-primary-light/10 text-primary-light'
                                    : 'text-text-tertiary hover:text-text-primary'
                            }`}
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`flex h-9 w-9 items-center justify-center rounded-r-lg transition ${
                                viewMode === 'table'
                                    ? 'bg-primary-light/10 text-primary-light'
                                    : 'text-text-tertiary hover:text-text-primary'
                            }`}
                        >
                            <List className="size-4" />
                        </button>
                    </div>

                    {/* New ticket button */}
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex min-h-10 items-center justify-center gap-3 rounded-xl bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:brightness-120"
                    >
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <p className="text-sm text-text-secondary">Loading tickets...</p>
            ) : viewMode === 'kanban' ? (
                <TicketKanbanView
                    tickets={tickets}
                    onSelectTicket={setSelectedTicket}
                />
            ) : (
                <TicketTableView
                    tickets={tickets}
                    onSelectTicket={setSelectedTicket}
                />
            )}

            {/* Modals */}
            {showCreate && (
                <CreateTicketModal onClose={() => setShowCreate(false)} />
            )}
            {selectedTicket && (
                <TicketDetailModal
                    ticketUuid={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </>
    );
}

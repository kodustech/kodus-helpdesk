'use client';

import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    status: string;
    config: { color: string; label: string };
    tickets: any[];
    onSelectTicket: (uuid: string) => void;
}

export function KanbanColumn({
    status,
    config,
    tickets,
    onSelectTicket,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <div
            ref={setNodeRef}
            className={`flex w-72 shrink-0 flex-col rounded-xl bg-card-lv1 transition ${
                isOver ? 'ring-2 ring-primary-light/40' : ''
            }`}
        >
            {/* Column header */}
            <div className="flex items-center gap-2 px-4 py-3">
                <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                />
                <span className="text-sm font-semibold text-text-primary">
                    {config.label}
                </span>
                <span className="ml-auto text-xs text-text-tertiary">
                    {tickets.length}
                </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 px-2 pb-2 min-h-24">
                {tickets.map((ticket) => (
                    <KanbanCard
                        key={ticket.uuid}
                        ticket={ticket}
                        onSelect={() => onSelectTicket(ticket.uuid)}
                    />
                ))}
            </div>
        </div>
    );
}

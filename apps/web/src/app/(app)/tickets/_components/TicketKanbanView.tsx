'use client';

import { useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import { useUpdateTicketStatus } from '@/core/hooks/useTickets';
import { STATUS_ORDER, STATUS_CONFIG } from './constants';
import { KanbanColumn } from './KanbanColumn';

interface TicketKanbanViewProps {
    tickets: any[];
    onSelectTicket: (uuid: string) => void;
}

export function TicketKanbanView({ tickets, onSelectTicket }: TicketKanbanViewProps) {
    const updateStatus = useUpdateTicketStatus();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );

    const ticketsByStatus = STATUS_ORDER.reduce(
        (acc, status) => {
            acc[status] = tickets.filter((t: any) => t.status === status);
            return acc;
        },
        {} as Record<string, any[]>,
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over) return;

            const ticketUuid = active.id as string;
            const newStatus = over.id as string;

            // Only proceed if dropping on a column (status)
            if (!STATUS_ORDER.includes(newStatus as any)) return;

            const ticket = tickets.find((t: any) => t.uuid === ticketUuid);
            if (!ticket || ticket.status === newStatus) return;

            updateStatus.mutate({ uuid: ticketUuid, status: newStatus });
        },
        [tickets, updateStatus],
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUS_ORDER.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        config={STATUS_CONFIG[status]}
                        tickets={ticketsByStatus[status] || []}
                        onSelectTicket={onSelectTicket}
                    />
                ))}
            </div>
        </DndContext>
    );
}

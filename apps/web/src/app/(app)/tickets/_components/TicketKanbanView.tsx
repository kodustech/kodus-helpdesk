'use client';

import { useCallback, useState } from 'react';
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

function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
            <div
                className={`px-5 py-4 rounded-lg shadow-xl text-white text-sm min-w-[300px] border-l-4 cursor-pointer ${
                    type === 'error' ? 'bg-red-700 border-red-500' : 'bg-green-700 border-green-500'
                }`}
                onClick={onClose}
            >
                {message}
            </div>
        </div>
    );
}

export function TicketKanbanView({ tickets, onSelectTicket }: TicketKanbanViewProps) {
    const updateStatus = useUpdateTicketStatus();
    const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

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

    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over) return;

            const ticketUuid = active.id as string;
            const newStatus = over.id as string;

            if (!STATUS_ORDER.includes(newStatus as any)) return;

            const ticket = tickets.find((t: any) => t.uuid === ticketUuid);
            if (!ticket || ticket.status === newStatus) return;

            updateStatus.mutate(
                { uuid: ticketUuid, status: newStatus },
                {
                    onError: (error: any) => {
                        const message = error?.response?.data?.message || 'Failed to update status';
                        showToast(message, 'error');
                    },
                },
            );
        },
        [tickets, updateStatus],
    );

    return (
        <>
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
}
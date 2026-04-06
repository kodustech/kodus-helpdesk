'use client';

import { useDraggable } from '@dnd-kit/core';
import { formatDate } from '@/lib/utils/date';
import { CategoryBadge } from './CategoryBadge';
import { LabelBadge } from './LabelBadge';

interface KanbanCardProps {
    ticket: any;
    onSelect: () => void;
}

export function KanbanCard({ ticket, onSelect }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({ id: ticket.uuid });

    const style = transform
        ? {
              transform: `translate(${transform.x}px, ${transform.y}px)`,
          }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onSelect}
            className={`flex flex-col gap-2 rounded-lg bg-card-lv2 p-3 ring-1 ring-card-lv3 cursor-pointer transition hover:brightness-120 ${
                isDragging ? 'opacity-50 shadow-lg' : ''
            }`}
        >
            {/* Title */}
            <span className="text-sm font-medium text-text-primary line-clamp-2">
                {ticket.title}
            </span>

            {/* Category */}
            <CategoryBadge category={ticket.category} />

            {/* Labels */}
            {ticket.ticketLabels?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {ticket.ticketLabels.slice(0, 3).map((tl: any) => (
                        <LabelBadge
                            key={tl.uuid}
                            name={tl.label?.name}
                            color={tl.label?.color}
                        />
                    ))}
                    {ticket.ticketLabels.length > 3 && (
                        <span className="text-xs text-text-tertiary">
                            +{ticket.ticketLabels.length - 3}
                        </span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end text-xs text-text-tertiary">
                <span>{formatDate(ticket.createdAt)}</span>
            </div>

            {/* Assignee */}
            {ticket.assignee && (
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <span className="size-4 flex items-center justify-center rounded-full bg-primary-light/20 text-[10px] font-bold text-primary-light">
                        {(ticket.assignee.name || ticket.assignee.email || '?')[0].toUpperCase()}
                    </span>
                    <span>{ticket.assignee.name || ticket.assignee.email}</span>
                </div>
            )}
        </div>
    );
}

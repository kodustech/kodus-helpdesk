'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthApi } from '@/core/hooks/useAuthApi';
import {
    TicketPlus,
    Clock,
    CheckCircle2,
    BarChart3,
} from 'lucide-react';

const STAT_CARDS = [
    {
        key: 'open',
        label: 'Open',
        color: '#5190ff',
        icon: TicketPlus,
        description: 'Tickets waiting for attention',
    },
    {
        key: 'in_progress',
        label: 'In Progress',
        color: '#f2c631',
        icon: Clock,
        description: 'Tickets being worked on',
    },
    {
        key: 'resolved',
        label: 'Resolved',
        color: '#42be65',
        icon: CheckCircle2,
        description: 'Resolved and closed tickets',
        combineWith: 'closed',
    },
    {
        key: 'total',
        label: 'Total',
        color: '#f8b76d',
        icon: BarChart3,
        description: 'All tickets',
    },
] as const;

export default function DashboardPage() {
    const { api } = useAuthApi();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['ticket-stats'],
        queryFn: async () => {
            const { data } = await api.get('/tickets/stats');
            return data;
        },
    });

    const getStatValue = (card: (typeof STAT_CARDS)[number]) => {
        if (!stats) return 0;
        if ('combineWith' in card && card.combineWith) {
            return (stats[card.key] || 0) + (stats[card.combineWith] || 0);
        }
        return stats[card.key] || 0;
    };

    return (
        <>
            <div className="flex min-h-12 shrink-0 items-center gap-6">
                <h1 className="text-2xl font-semibold text-text-primary">
                    Dashboard
                </h1>
            </div>

            {isLoading ? (
                <p className="text-sm text-text-secondary">Loading stats...</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {STAT_CARDS.map((card) => {
                        const Icon = card.icon;
                        const value = getStatValue(card);

                        return (
                            <div
                                key={card.key}
                                className="flex flex-col gap-3 rounded-xl bg-card-lv2 p-6 shadow-sm ring-1 ring-card-lv3"
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="flex size-10 items-center justify-center rounded-xl"
                                        style={{
                                            backgroundColor: `${card.color}15`,
                                        }}
                                    >
                                        <Icon
                                            className="size-5"
                                            style={{ color: card.color }}
                                        />
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span
                                        className="text-3xl font-bold"
                                        style={{ color: card.color }}
                                    >
                                        {value}
                                    </span>
                                    <span className="text-sm font-semibold text-text-primary">
                                        {card.label}
                                    </span>
                                    <span className="text-xs text-text-tertiary">
                                        {card.description}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

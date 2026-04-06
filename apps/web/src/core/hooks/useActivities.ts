'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

export function useActivities(ticketUuid: string | null) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['activities', ticketUuid],
        queryFn: async () => {
            const { data } = await api.get(
                `/tickets/${ticketUuid}/activities`,
            );
            return data;
        },
        enabled: !!ticketUuid,
    });
}

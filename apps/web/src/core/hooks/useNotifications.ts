'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

export function useNotifications(limit = 20) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['notifications', limit],
        queryFn: async () => {
            const { data } = await api.get(
                `/notifications?limit=${limit}`,
            );
            return data;
        },
    });
}

export function useUnreadCount() {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const { data } = await api.get('/notifications/unread-count');
            return data.count as number;
        },
        refetchInterval: 30000,
    });
}

export function useMarkAsRead() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string) => {
            await api.patch(`/notifications/${uuid}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
                queryKey: ['notifications-unread-count'],
            });
        },
    });
}

export function useMarkAllAsRead() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await api.patch('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
                queryKey: ['notifications-unread-count'],
            });
        },
    });
}

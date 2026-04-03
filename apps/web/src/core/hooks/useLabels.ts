'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

export function useLabels() {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['labels'],
        queryFn: async () => {
            const { data } = await api.get('/labels');
            return data;
        },
    });
}

export function useCreateLabel() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { name: string; color: string }) => {
            const { data } = await api.post('/labels', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels'] });
        },
    });
}

export function useUpdateLabel() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            ...payload
        }: {
            uuid: string;
            name?: string;
            color?: string;
        }) => {
            const { data } = await api.patch(`/labels/${uuid}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels'] });
        },
    });
}

export function useDeleteLabel() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uuid: string) => {
            await api.delete(`/labels/${uuid}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels'] });
        },
    });
}

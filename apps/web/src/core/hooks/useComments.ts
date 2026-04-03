'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

export function useComments(ticketUuid: string | null) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['comments', ticketUuid],
        queryFn: async () => {
            const { data } = await api.get(
                `/tickets/${ticketUuid}/comments`,
            );
            return data;
        },
        enabled: !!ticketUuid,
    });
}

export function useCreateComment() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            content,
            mentioned_user_ids,
        }: {
            ticketUuid: string;
            content: Record<string, any>;
            mentioned_user_ids?: string[];
        }) => {
            const { data } = await api.post(
                `/tickets/${ticketUuid}/comments`,
                { content, mentioned_user_ids },
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.ticketUuid],
            });
        },
    });
}

export function useUpdateComment() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            commentUuid,
            content,
            mentioned_user_ids,
        }: {
            ticketUuid: string;
            commentUuid: string;
            content: Record<string, any>;
            mentioned_user_ids?: string[];
        }) => {
            const { data } = await api.patch(
                `/tickets/${ticketUuid}/comments/${commentUuid}`,
                { content, mentioned_user_ids },
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.ticketUuid],
            });
        },
    });
}

export function useDeleteComment() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            commentUuid,
        }: {
            ticketUuid: string;
            commentUuid: string;
        }) => {
            await api.delete(
                `/tickets/${ticketUuid}/comments/${commentUuid}`,
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.ticketUuid],
            });
        },
    });
}

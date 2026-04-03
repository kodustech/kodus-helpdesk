'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

interface TicketFilters {
    status?: string;
    customer_id?: string;
    assignee_id?: string;
    category?: string;
}

export function useTickets(filters?: TicketFilters) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['tickets', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.set('status', filters.status);
            if (filters?.customer_id) params.set('customer_id', filters.customer_id);
            if (filters?.assignee_id) params.set('assignee_id', filters.assignee_id);
            if (filters?.category) params.set('category', filters.category);

            const { data } = await api.get(`/tickets?${params.toString()}`);
            return data;
        },
    });
}

export function useTicket(uuid: string | null) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['ticket', uuid],
        queryFn: async () => {
            const { data } = await api.get(`/tickets/${uuid}`);
            return data;
        },
        enabled: !!uuid,
    });
}

export function useCreateTicket() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            title: string;
            description: Record<string, any>;
            category: string;
            customer_id?: string;
        }) => {
            const { data } = await api.post('/tickets', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

export function useUpdateTicket() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            ...payload
        }: {
            uuid: string;
            title?: string;
            description?: Record<string, any>;
            category?: string;
        }) => {
            const { data } = await api.patch(`/tickets/${uuid}`, payload);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.uuid] });
        },
    });
}

export function useUpdateTicketStatus() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ uuid, status }: { uuid: string; status: string }) => {
            const { data } = await api.patch(`/tickets/${uuid}/status`, { status });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.uuid] });
        },
    });
}

export function useUpdateTicketAssignee() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            assignee_id,
        }: {
            uuid: string;
            assignee_id: string;
        }) => {
            const { data } = await api.patch(`/tickets/${uuid}/assignee`, {
                assignee_id,
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.uuid] });
        },
    });
}

export function useAddTicketLabels() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            uuid,
            label_ids,
        }: {
            uuid: string;
            label_ids: string[];
        }) => {
            const { data } = await api.post(`/tickets/${uuid}/labels`, {
                label_ids,
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.uuid] });
        },
    });
}

export function useRemoveTicketLabel() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            labelUuid,
        }: {
            ticketUuid: string;
            labelUuid: string;
        }) => {
            await api.delete(`/tickets/${ticketUuid}/labels/${labelUuid}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({
                queryKey: ['ticket', variables.ticketUuid],
            });
        },
    });
}

export function useMentionableUsers(ticketUuid: string | null) {
    const { api } = useAuthApi();

    return useQuery({
        queryKey: ['mentionable-users', ticketUuid],
        queryFn: async () => {
            const { data } = await api.get(
                `/tickets/${ticketUuid}/mentionable-users`,
            );
            return data;
        },
        enabled: !!ticketUuid,
    });
}

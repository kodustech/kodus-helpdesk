'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthApi } from './useAuthApi';

export interface Attachment {
    uuid: string;
    filename: string;
    mimeType: string;
    size: number;
    s3Key: string;
    url: string;
    uploadedBy: {
        uuid: string;
        name: string;
        email: string;
    };
    createdAt: string;
}

export function useAttachments(ticketUuid: string | null) {
    const { api } = useAuthApi();

    return useQuery<Attachment[]>({
        queryKey: ['attachments', ticketUuid],
        queryFn: async () => {
            const { data } = await api.get(
                `/tickets/${ticketUuid}/attachments`,
            );
            return data;
        },
        enabled: !!ticketUuid,
    });
}

export function useUploadAttachments() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            files,
        }: {
            ticketUuid: string;
            files: File[];
        }) => {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));

            const { data } = await api.post(
                `/tickets/${ticketUuid}/attachments`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['attachments', variables.ticketUuid],
            });
        },
    });
}

export function useDeleteAttachment() {
    const { api } = useAuthApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketUuid,
            attachmentUuid,
        }: {
            ticketUuid: string;
            attachmentUuid: string;
        }) => {
            await api.delete(
                `/tickets/${ticketUuid}/attachments/${attachmentUuid}`,
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['attachments', variables.ticketUuid],
            });
        },
    });
}

'use client';

import { useState, useCallback, useRef } from 'react';
import {
    Paperclip,
    Upload,
    X,
    Download,
    Trash2,
    FileText,
    FileSpreadsheet,
    FileCode,
    Image as ImageIcon,
    File as FileIcon,
} from 'lucide-react';
import {
    useAttachments,
    useUploadAttachments,
    useDeleteAttachment,
    type Attachment,
} from '@/core/hooks/useAttachments';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
];

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType.includes('word')) return FileText;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType === 'text/csv')
        return FileSpreadsheet;
    if (mimeType === 'application/json') return FileCode;
    return FileIcon;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
}

interface AttachmentsSectionProps {
    ticketUuid: string;
}

export function AttachmentsSection({ ticketUuid }: AttachmentsSectionProps) {
    const { data: attachments = [], isLoading } = useAttachments(ticketUuid);
    const uploadMutation = useUploadAttachments();
    const deleteMutation = useDeleteAttachment();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState('');
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const remainingSlots = MAX_FILES - attachments.length;

    const handleFiles = useCallback(
        async (fileList: FileList | File[]) => {
            setError('');
            const files = Array.from(fileList);

            if (files.length > remainingSlots) {
                setError(
                    `You can only upload ${remainingSlots} more file(s). Max ${MAX_FILES} per ticket.`,
                );
                return;
            }

            for (const file of files) {
                if (file.size > MAX_SIZE) {
                    setError(`"${file.name}" exceeds the 10MB limit`);
                    return;
                }
                if (!ALLOWED_TYPES.includes(file.type)) {
                    setError(
                        `"${file.name}" has an unsupported file type`,
                    );
                    return;
                }
            }

            try {
                await uploadMutation.mutateAsync({ ticketUuid, files });
            } catch (err: any) {
                setError(
                    err.response?.data?.message || 'Failed to upload files',
                );
            }
        },
        [ticketUuid, remainingSlots, uploadMutation],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles],
    );

    const handleDelete = async (attachmentUuid: string) => {
        try {
            await deleteMutation.mutateAsync({ ticketUuid, attachmentUuid });
        } catch (err: any) {
            setError(
                err.response?.data?.message || 'Failed to delete attachment',
            );
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    <Paperclip className="size-3.5" />
                    Attachments ({attachments.length}/{MAX_FILES})
                </span>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                    {error}
                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="ml-auto"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}

            {/* Upload zone */}
            {remainingSlots > 0 && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-4 transition ${
                        dragOver
                            ? 'border-primary-light bg-primary-light/5'
                            : 'border-card-lv3 hover:border-text-tertiary'
                    }`}
                >
                    <Upload
                        className={`size-5 ${
                            dragOver
                                ? 'text-primary-light'
                                : 'text-text-tertiary'
                        }`}
                    />
                    <span className="text-xs text-text-tertiary">
                        {uploadMutation.isPending
                            ? 'Uploading...'
                            : 'Drop files here or click to browse'}
                    </span>
                    <span className="text-[10px] text-text-tertiary/60">
                        Images, PDF, DOC, XLS, CSV, JSON — max 10MB each
                    </span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) {
                                handleFiles(e.target.files);
                                e.target.value = '';
                            }
                        }}
                    />
                </div>
            )}

            {/* Attachment list */}
            {isLoading ? (
                <p className="text-xs text-text-tertiary">Loading attachments...</p>
            ) : attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                    {attachments.map((attachment) => (
                        <AttachmentCard
                            key={attachment.uuid}
                            attachment={attachment}
                            ticketUuid={ticketUuid}
                            onDelete={handleDelete}
                            onPreview={
                                isImage(attachment.mimeType)
                                    ? () => setLightboxUrl(attachment.url)
                                    : undefined
                            }
                            isDeleting={deleteMutation.isPending}
                        />
                    ))}
                </div>
            ) : null}

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxUrl(null)}
                        className="absolute right-4 top-4 text-white/70 hover:text-white transition"
                    >
                        <X className="size-6" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Preview"
                        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

function AttachmentCard({
    attachment,
    ticketUuid,
    onDelete,
    onPreview,
    isDeleting,
}: {
    attachment: Attachment;
    ticketUuid: string;
    onDelete: (uuid: string) => void;
    onPreview?: () => void;
    isDeleting: boolean;
}) {
    const Icon = getFileIcon(attachment.mimeType);
    const isImg = isImage(attachment.mimeType);

    const handleDownload = async () => {
        window.open(attachment.url, '_blank');
    };

    return (
        <div className="group relative flex items-center gap-2.5 rounded-lg bg-card-lv1 p-2.5 ring-1 ring-card-lv3 transition hover:brightness-120">
            {/* Thumbnail or icon */}
            {isImg ? (
                <button
                    type="button"
                    onClick={onPreview}
                    className="size-10 shrink-0 overflow-hidden rounded-md"
                >
                    <img
                        src={attachment.url}
                        alt={attachment.filename}
                        className="size-full object-cover"
                    />
                </button>
            ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card-lv3">
                    <Icon className="size-5 text-text-tertiary" />
                </div>
            )}

            {/* File info */}
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-text-primary">
                    {attachment.filename}
                </span>
                <span className="text-[10px] text-text-tertiary">
                    {formatSize(attachment.size)}
                </span>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-md p-1 text-text-tertiary hover:text-text-primary transition"
                    title="Download"
                >
                    <Download className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(attachment.uuid)}
                    disabled={isDeleting}
                    className="rounded-md p-1 text-text-tertiary hover:text-danger transition disabled:opacity-50"
                    title="Delete"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

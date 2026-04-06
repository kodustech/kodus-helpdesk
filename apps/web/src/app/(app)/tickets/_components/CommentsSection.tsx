'use client';

import { useRef } from 'react';
import { useComments, useCreateComment } from '@/core/hooks/useComments';
import { useMentionableUsers } from '@/core/hooks/useTickets';
import { CommentEditor, CommentEditorHandle } from './editor/CommentEditor';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';

function ReadOnlyContent({ content }: { content: Record<string, any> }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ paragraph: { HTMLAttributes: { class: 'm-0' } } }),
            Mention.configure({ HTMLAttributes: { class: 'mention' } }),
        ],
        content,
        editable: false,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'tiptap-editor text-sm',
            },
        },
    });
    if (!editor) return null;
    return <EditorContent editor={editor} />;
}

export function CommentsSection({ ticketUuid }: { ticketUuid: string }) {
    const { data: comments = [], isLoading } = useComments(ticketUuid);
    const { data: mentionableUsers = [] } = useMentionableUsers(ticketUuid);
    const createComment = useCreateComment();
    const editorRef = useRef<CommentEditorHandle>(null);

    const handleSubmit = async () => {
        if (!editorRef.current || editorRef.current.isEmpty()) return;

        const content = editorRef.current.getJSON();
        const mentioned_user_ids = editorRef.current.getMentionedUserIds();

        try {
            await createComment.mutateAsync({
                ticketUuid,
                content,
                mentioned_user_ids: mentioned_user_ids.length ? mentioned_user_ids : undefined,
            });
            editorRef.current.clear();
        } catch {
            // error handled by UI
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Comment list */}
            <div className="flex flex-col gap-3">
                {isLoading && (
                    <p className="text-sm text-text-secondary">Loading comments...</p>
                )}
                {!isLoading && comments.length === 0 && (
                    <p className="text-sm text-text-tertiary">No comments yet.</p>
                )}
                {comments.map((comment: any) => (
                    <div
                        key={comment.uuid}
                        className="flex flex-col gap-2 rounded-xl bg-card-lv1 p-4 ring-1 ring-card-lv3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-primary">
                                {comment.author?.name || comment.author?.email || 'Unknown'}
                            </span>
                            <span className="text-xs text-text-tertiary">
                                {new Date(comment.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <ReadOnlyContent content={comment.content} />
                    </div>
                ))}
            </div>

            {/* New comment */}
            <div className="flex flex-col gap-2">
                <CommentEditor
                    ref={editorRef}
                    onSubmit={handleSubmit}
                    mentionableUsers={mentionableUsers}
                />
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                        Ctrl+Enter to submit &middot; Type @ to mention
                    </span>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={createComment.isPending}
                        className="inline-flex min-h-8 items-center justify-center rounded-lg bg-primary-light px-4 py-1.5 text-xs font-semibold text-primary-dark transition hover:brightness-120 disabled:opacity-50"
                    >
                        {createComment.isPending ? 'Sending...' : 'Comment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

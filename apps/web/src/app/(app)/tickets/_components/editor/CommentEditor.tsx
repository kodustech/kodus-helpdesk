'use client';

import { useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import { createMentionExtension } from './MentionExtension';

interface MentionUser {
    uuid: string;
    name: string;
    email: string;
    role: string;
}

export interface CommentEditorHandle {
    getJSON: () => Record<string, any>;
    clear: () => void;
    focus: () => void;
    isEmpty: () => boolean;
    getMentionedUserIds: () => string[];
}

interface CommentEditorProps {
    placeholder?: string;
    className?: string;
    onSubmit?: () => void;
    mentionableUsers?: MentionUser[];
}

export const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
    function CommentEditor({ placeholder = 'Write a comment...', className = '', onSubmit, mentionableUsers = [] }, ref) {
        const onSubmitRef = useRef(onSubmit);
        onSubmitRef.current = onSubmit;

        const mentionExtension = useMemo(
            () => createMentionExtension(mentionableUsers),
            [mentionableUsers],
        );

        const editor = useEditor({
            extensions: [
                StarterKit.configure({
                    paragraph: { HTMLAttributes: { class: 'm-0' } },
                    heading: { levels: [1, 2, 3] },
                }),
                LinkExtension.configure({
                    openOnClick: false,
                    HTMLAttributes: { class: 'text-primary-light underline' },
                }),
                Placeholder.configure({ placeholder }),
                mentionExtension,
            ],
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            immediatelyRender: false,
            editorProps: {
                attributes: {
                    class: [
                        'tiptap-editor',
                        'min-h-20 w-full rounded-xl px-4 py-3 text-sm ring-1 outline-hidden transition-all',
                        'bg-card-lv1 ring-card-lv3',
                        'focus-within:ring-primary-light/30 focus-within:ring-2 hover:brightness-120',
                        className,
                    ].join(' '),
                },
                handleKeyDown: (_view, event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        onSubmitRef.current?.();
                        return true;
                    }
                    return false;
                },
            },
        });

        useImperativeHandle(ref, () => ({
            getJSON: () => editor?.getJSON() || { type: 'doc', content: [] },
            clear: () => {
                editor?.commands.clearContent();
            },
            focus: () => {
                editor?.commands.focus();
            },
            isEmpty: () => editor?.isEmpty ?? true,
            getMentionedUserIds: () => {
                if (!editor) return [];
                const ids: string[] = [];
                editor.state.doc.descendants((node) => {
                    if (node.type.name === 'mention' && node.attrs.id) {
                        ids.push(node.attrs.id);
                    }
                });
                return [...new Set(ids)];
            },
        }));

        if (!editor) return null;

        return <EditorContent editor={editor} />;
    },
);

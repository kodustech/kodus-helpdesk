'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';

export interface CommentEditorHandle {
    getJSON: () => Record<string, any>;
    clear: () => void;
    focus: () => void;
    isEmpty: () => boolean;
}

interface CommentEditorProps {
    placeholder?: string;
    className?: string;
    onSubmit?: () => void;
}

export const CommentEditor = forwardRef<CommentEditorHandle, CommentEditorProps>(
    function CommentEditor({ placeholder = 'Write a comment...', className = '', onSubmit }, ref) {
        const onSubmitRef = useRef(onSubmit);
        onSubmitRef.current = onSubmit;

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
            ],
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            immediatelyRender: false,
            editorProps: {
                attributes: {
                    class: [
                        'min-h-20 w-full rounded-xl px-4 py-3 text-sm ring-1 outline-hidden transition-all',
                        'bg-card-lv1 ring-card-lv3 text-text-primary',
                        'prose prose-sm prose-invert max-w-none',
                        'focus-within:ring-primary-light/30 focus-within:ring-2 hover:brightness-120',
                        '[&_code]:bg-card-lv3 [&_code]:text-primary-light [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs',
                        '[&_.is-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-empty:first-child::before]:float-left [&_.is-empty:first-child::before]:text-text-placeholder/50 [&_.is-empty:first-child::before]:pointer-events-none [&_.is-empty:first-child::before]:h-0',
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
        }));

        if (!editor) return null;

        return <EditorContent editor={editor} />;
    },
);

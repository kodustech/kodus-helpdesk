'use client';

import { useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block';
import LinkExtension from '@tiptap/extension-link';
import { EditorToolbar } from './EditorToolbar';

interface TicketDescriptionEditorProps {
    content: Record<string, any> | null;
    onChange: (json: Record<string, any>) => void;
    editable?: boolean;
    placeholder?: string;
    className?: string;
}

export function TicketDescriptionEditor({
    content,
    onChange,
    editable = true,
    placeholder = 'Describe the ticket...',
    className = '',
}: TicketDescriptionEditorProps) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: { HTMLAttributes: { class: 'm-0' } },
                codeBlock: false,
                heading: { levels: [1, 2, 3] },
            }),
            CodeBlockLowlight.configure({
                HTMLAttributes: { class: 'code-block' },
            }),
            LinkExtension.configure({
                openOnClick: !editable,
                HTMLAttributes: { class: 'text-primary-light underline' },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChangeRef.current(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: [
                    'min-h-32 w-full rounded-xl px-6 py-4 text-sm ring-1 outline-hidden transition-all',
                    'bg-card-lv1 ring-card-lv3 text-text-primary',
                    'prose prose-sm prose-invert max-w-none',
                    editable
                        ? 'focus-within:ring-primary-light/30 focus-within:ring-2 hover:brightness-120'
                        : 'opacity-80',
                    '[&_code]:bg-card-lv3 [&_code]:text-primary-light [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs',
                    '[&_.is-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-empty:first-child::before]:float-left [&_.is-empty:first-child::before]:text-text-placeholder/50 [&_.is-empty:first-child::before]:pointer-events-none [&_.is-empty:first-child::before]:h-0',
                    className,
                ].join(' '),
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="flex flex-col gap-2">
            {editable && <EditorToolbar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    );
}

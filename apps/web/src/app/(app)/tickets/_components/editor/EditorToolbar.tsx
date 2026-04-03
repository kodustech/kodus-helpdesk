'use client';

import { Editor } from '@tiptap/react';
import {
    Bold,
    Code,
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    Link,
    List,
    ListOrdered,
    Minus,
    Quote,
} from 'lucide-react';

function ToolbarButton({
    onClick,
    disabled,
    active,
    title,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition hover:text-text-primary disabled:opacity-30 ${
                active ? 'bg-primary-light/10 text-primary-light' : ''
            }`}
        >
            {children}
        </button>
    );
}

export function EditorToolbar({ editor }: { editor: Editor | null }) {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-card-lv3 bg-card-lv2 p-1">
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                title="Bold"
            >
                <Bold className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                title="Italic"
            >
                <Italic className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                active={editor.isActive('code')}
                title="Inline Code"
            >
                <Code className="size-4" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-card-lv3" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
            >
                <Heading1 className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
            >
                <Heading2 className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
            >
                <Heading3 className="size-4" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-card-lv3" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                title="Bullet List"
            >
                <List className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                title="Ordered List"
            >
                <ListOrdered className="size-4" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-card-lv3" />

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                title="Blockquote"
            >
                <Quote className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive('codeBlock')}
                title="Code Block"
            >
                <Code2 className="size-4" />
            </ToolbarButton>

            <div className="mx-1 h-4 w-px bg-card-lv3" />

            <ToolbarButton
                onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
                active={editor.isActive('link')}
                title="Link"
            >
                <Link className="size-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Horizontal Rule"
            >
                <Minus className="size-4" />
            </ToolbarButton>
        </div>
    );
}

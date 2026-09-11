"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import { useEffect, useCallback, useRef, useState } from "react";
import { Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, CheckSquare, Undo2, Redo2, Link as LinkIcon } from "lucide-react";

type TiptapEditorProps = {
  content?: Record<string, unknown> | null;
  placeholder?: string;
  onChange?: (json: Record<string, unknown>, text: string) => void;
  onBlur?: () => void;
  editable?: boolean;
  className?: string;
};

function ToolbarButton({ onClick, active, disabled, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${active ? "bg-[#e7f2ed] text-[#506545]" : "text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ content, placeholder, onChange, onBlur, editable = true, className }: TiptapEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarBottom, setToolbarBottom] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Tulis catatan...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", class: "text-[#4a8a83] underline cursor-pointer" } }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>, editor.getText());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2",
      },
    },
  });

  // Mobile toolbar positioning
  useEffect(() => {
    if (!editable) return;
    const handleViewport = () => {
      if (!window.visualViewport) return;
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      setToolbarBottom(viewportHeight < windowHeight * 0.8);
    };
    window.visualViewport?.addEventListener("resize", handleViewport);
    return () => window.visualViewport?.removeEventListener("resize", handleViewport);
  }, [editable]);

  // Expose editor methods
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  if (!editor) return null;

  const toolbar = editable && (
    <div
      ref={toolbarRef}
      className={`flex items-center gap-0.5 overflow-x-auto rounded-t-xl border-b border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 ${toolbarBottom ? "fixed bottom-0 left-0 right-0 z-50 rounded-none border-t shadow-[0_-2px_8px_rgba(0,0,0,0.08)]" : ""}`}
    >
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2"><Heading2 size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3"><Heading3 size={16} /></ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[var(--line)]" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><Strikethrough size={16} /></ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[var(--line)]" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><List size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List"><ListOrdered size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist"><CheckSquare size={16} /></ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[var(--line)]" />
      <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link"><LinkIcon size={16} /></ToolbarButton>
      <div className="mx-1 h-5 w-px bg-[var(--line)]" />
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo2 size={16} /></ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo2 size={16} /></ToolbarButton>
    </div>
  );

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] ${className || ""}`}>
      {toolbar}
      <style jsx global>{`
        .ProseMirror p { margin: 0.4em 0; }
        .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.8em 0 0.4em; color: var(--ink); }
        .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; color: var(--ink); }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0.4em 0; }
        .ProseMirror li { margin: 0.2em 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
        .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 0.15em; }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #506545; cursor: pointer; }
        .ProseMirror ul[data-type="taskList"] li > div { flex: 1; min-width: 0; }
        .ProseMirror blockquote { border-left: 3px solid var(--line-strong); padding-left: 1em; margin: 0.4em 0; color: var(--muted); }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: var(--muted); pointer-events: none; height: 0; }
        .ProseMirror a { color: #4a8a83; text-decoration: underline; cursor: pointer; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror mark { background-color: #fbf1db; }
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .ProseMirror h2, .ProseMirror h3 { color: #e2ede6; }
          .ProseMirror a { color: #7dc4b8; }
          .ProseMirror mark { background-color: #3d3520; }
          .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] { accent-color: #7dc4b8; }
        }
        .dark .ProseMirror h2, .dark .ProseMirror h3 { color: #e2ede6; }
        .dark .ProseMirror a { color: #7dc4b8; }
        .dark .ProseMirror mark { background-color: #3d3520; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

export function TiptapViewer({ content, fallback, className }: { content?: Record<string, unknown> | null; fallback?: string | null; className?: string }) {
  const fallbackDoc = fallback ? { type: "doc", content: fallback.split("\n").filter(Boolean).map(line => ({ type: "paragraph", content: [{ type: "text", text: line }] })) } : null;

  return (
    <TiptapEditor
      content={content || fallbackDoc}
      editable={false}
      className={className}
    />
  );
}

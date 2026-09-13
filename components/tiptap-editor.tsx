"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect, useCallback, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  RemoveFormatting,
  Undo2,
  Redo2,
} from "lucide-react";

type TiptapEditorProps = {
  content?: Record<string, unknown> | null;
  placeholder?: string;
  onChange?: (json: Record<string, unknown>, text: string) => void;
  onBlur?: () => void;
  editable?: boolean;
  className?: string;
  minHeight?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg transition-colors ${
        active
          ? "bg-[#e7f2ed] text-[#506545] font-semibold"
          : "text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 sm:mx-1 h-4 sm:h-5 w-px shrink-0 bg-[var(--line)]" />;
}

export function TiptapEditor({
  content,
  placeholder,
  onChange,
  onBlur,
  editable = true,
  className,
  minHeight = "min-h-[130px]",
}: TiptapEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarBottom, setToolbarBottom] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Tulis catatan...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          class: "text-[#4a8a83] underline cursor-pointer",
        },
      }),
    ],
    content: content || undefined,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON() as Record<string, unknown>, ed.getText());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${minHeight} px-3 py-2.5`,
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

  // Expose link prompt
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL tautan:", previousUrl || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }, [editor]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return null;

  const toolbar = editable && (
    <div
      ref={toolbarRef}
      className={`flex items-center gap-0.5 overflow-x-auto rounded-t-xl border-b border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 ${
        toolbarBottom
          ? "fixed bottom-0 left-0 right-0 z-50 rounded-none border-t shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
          : ""
      }`}
    >
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Judul 1 / Heading 1 (##)"
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Judul 2 / Heading 2 (###)"
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Judul 3 / Heading 3 (####)"
      >
        <Heading3 size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Tebal / Bold (Ctrl+B)"
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Miring / Italic (Ctrl+I)"
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Garis Bawah / Underline (Ctrl+U)"
      >
        <UnderlineIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Coret / Strikethrough"
      >
        <Strikethrough size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Kode Inline / Code"
      >
        <Code size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Daftar Poin / Bullet List (- )"
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Daftar Nomor / Numbered List (1. )"
      >
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        title="Checklist / To-Do ([ ])"
      >
        <CheckSquare size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Kutipan / Blockquote (> )"
      >
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Garis Pemisah / Divider (---)"
      >
        <Minus size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        title="Sisipkan Tautan / Link"
      >
        <LinkIcon size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={clearFormatting}
        title="Hapus Format / Clear Formatting"
      >
        <RemoveFormatting size={15} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Urungkan / Undo (Ctrl+Z)"
      >
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Ulangi / Redo (Ctrl+Y)"
      >
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  );

  return (
    <div className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-[#506545]/50 focus-within:ring-1 focus-within:ring-[#506545]/20 ${className || ""}`}>
      {toolbar}
      <style jsx global>{`
        .ProseMirror p { margin: 0.35em 0; line-height: 1.55; }
        .ProseMirror h1 { font-size: 1.35em; font-weight: 700; margin: 0.7em 0 0.3em; color: var(--ink); line-height: 1.3; }
        .ProseMirror h2 { font-size: 1.2em; font-weight: 700; margin: 0.65em 0 0.3em; color: var(--ink); line-height: 1.35; }
        .ProseMirror h3 { font-size: 1.05em; font-weight: 600; margin: 0.55em 0 0.25em; color: var(--ink); line-height: 1.4; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .ProseMirror li { margin: 0.2em 0; }
        .ProseMirror u { text-decoration: underline; text-underline-offset: 2px; }
        .ProseMirror code { background-color: #eef3ec; color: #3b5038; border-radius: 4px; padding: 0.12em 0.35em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.88em; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; }
        .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 0.18em; }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] { width: 15px; height: 15px; accent-color: #506545; cursor: pointer; }
        .ProseMirror ul[data-type="taskList"] li > div { flex: 1; min-width: 0; }
        .ProseMirror blockquote { border-left: 3px solid #8da090; padding-left: 0.85em; margin: 0.5em 0; color: var(--muted); font-style: italic; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 0.8em 0; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: var(--muted); opacity: 0.8; pointer-events: none; height: 0; }
        .ProseMirror a { color: #4a8a83; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
        .ProseMirror:focus { outline: none; }
        .ProseMirror mark { background-color: #fbf1db; }
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: #e2ede6; }
          .ProseMirror code { background-color: #243328; color: #a3cca8; }
          .ProseMirror a { color: #7dc4b8; }
          .ProseMirror mark { background-color: #3d3520; }
          .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] { accent-color: #7dc4b8; }
        }
        .dark .ProseMirror h1, .dark .ProseMirror h2, .dark .ProseMirror h3 { color: #e2ede6; }
        .dark .ProseMirror code { background-color: #243328; color: #a3cca8; }
        .dark .ProseMirror a { color: #7dc4b8; }
        .dark .ProseMirror mark { background-color: #3d3520; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

export function TiptapViewer({
  content,
  fallback,
  className,
}: {
  content?: Record<string, unknown> | null;
  fallback?: string | null;
  className?: string;
}) {
  const fallbackDoc = fallback
    ? {
        type: "doc",
        content: fallback
          .split("\n")
          .filter(Boolean)
          .map((line) => ({
            type: "paragraph",
            content: [{ type: "text", text: line }],
          })),
      }
    : null;

  return (
    <TiptapEditor
      content={content || fallbackDoc}
      editable={false}
      className={className}
    />
  );
}

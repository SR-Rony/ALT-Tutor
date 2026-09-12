"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ImageIcon,
  IndentIncrease,
  IndentDecrease,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Sigma,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Undo2,
} from "lucide-react";
import { normalizeRichTextContent } from "@/lib/rich-text";
import { Indent } from "@/lib/tiptap-indent";
import {
  FontSize,
  FONT_SIZE_OPTIONS,
  TextStyle,
  normalizeFontSize,
} from "@/lib/tiptap-font-size";
import { QbImage, type QbImageSnapAlign } from "@/lib/tiptap-image";
import {
  applyEditorMath,
  MATH_OPEN_EVENT,
  MathDisplay,
  MathInline,
  readSelectedMath,
} from "@/lib/tiptap-math";
import { MathEquationDialog } from "@/components/ui/math-equation-dialog";
import { uploadService } from "@/services/upload.service";
import { cn } from "@/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  minHeight?: string;
  className?: string;
  /** Folder used when uploading inline images. */
  uploadFolder?: "questionbank" | "lessons" | "courses" | "assignments" | "blogs" | "avatars";
};

type TextAlignValue = QbImageSnapAlign | "justify";

function normalizeActiveFontSize(raw: unknown): string {
  return normalizeFontSize(typeof raw === "string" ? raw : null) ?? "";
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-primary-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}

function setEditorAlignment(editor: Editor, align: TextAlignValue) {
  if (align !== "justify") {
    if (editor.isActive("image")) {
      editor.chain().focus().updateAttributes("image", { align, offset: 0 }).run();
      return;
    }
    const { state } = editor;
    const { selection } = state;
    const node = state.doc.nodeAt(selection.from);
    if (node?.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { align, offset: 0 }).run();
      return;
    }
  }
  editor.chain().focus().setTextAlign(align).run();
}

function isEditorAlignmentActive(editor: Editor, align: TextAlignValue) {
  if (align !== "justify" && editor.isActive("image", { align })) return true;
  return editor.isActive({ textAlign: align });
}

/** Keep consecutive spaces as NBSP so indentation-by-space survives save/render. */
function handlePreserveSpaces(
  view: { state: Editor["state"]; dispatch: (tr: Editor["state"]["tr"]) => void },
  event: KeyboardEvent
) {
  if (event.key !== " " || event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }
  const { state } = view;
  const { from, empty } = state.selection;
  if (!empty || from === 0) return false;
  const before = state.doc.textBetween(from - 1, from, "\n", "\n");
  if (before !== " " && before !== "\u00A0") return false;
  view.dispatch(state.tr.insertText("\u00A0", from, from).scrollIntoView());
  return true;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a description…",
  disabled = false,
  id,
  minHeight = "120px",
  className,
  uploadFolder = "questionbank",
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);
  const [mathDraft, setMathDraft] = useState({ latex: "", display: true });
  const mathOpenerRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      QbImage,
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Indent,
      TextStyle,
      FontSize,
      MathInline,
      MathDisplay,
    ],
    content: normalizeRichTextContent(value),
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: "rich-text-editor__content outline-none",
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "m") {
          event.preventDefault();
          mathOpenerRef.current();
          return true;
        }
        return handlePreserveSpaces(view, event);
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = normalizeRichTextContent(value);
    const current = editor.getHTML();
    const normalizedCurrent = current === "<p></p>" ? "" : current;
    if (next !== normalizedCurrent) {
      editor.commands.setContent(next || "", { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const openMathDialog = () => {
    if (!editor) return;
    const selected = readSelectedMath(editor);
    setMathDraft(selected ?? { latex: "", display: true });
    setMathOpen(true);
  };
  mathOpenerRef.current = openMathDialog;

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onOpen = () => mathOpenerRef.current();
    dom.addEventListener(MATH_OPEN_EVENT, onOpen);
    return () => dom.removeEventListener(MATH_OPEN_EVENT, onOpen);
  }, [editor]);

  const insertImageFile = async (file: File | undefined) => {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const result = await uploadService.upload(file, uploadFolder);
      editor
        .chain()
        .focus()
        .setImage({ src: result.url, alt: file.name })
        .updateAttributes("image", { align: "left", offset: 0 })
        .run();
    } catch {
      window.alert("Image upload failed. Try again or paste an image URL.");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground",
          className
        )}
        style={{ minHeight }}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <>
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          disabled={disabled}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          disabled={disabled}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Superscript"
          disabled={disabled}
          active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Subscript"
          disabled={disabled}
          active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <label className="ml-1 inline-flex items-center">
          <span className="sr-only">Font size</span>
          <select
            aria-label="Font size"
            title="Font size"
            disabled={disabled}
            className="h-8 max-w-[6.5rem] rounded-lg border border-border bg-card px-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
            value={
              normalizeActiveFontSize(editor.getAttributes("textStyle").fontSize) ?? ""
            }
            onChange={(e) => {
              const next = e.target.value;
              if (!next) {
                editor.chain().focus().unsetFontSize().run();
                return;
              }
              editor.chain().focus().setFontSize(next).run();
            }}
          >
            <option value="">Size</option>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Bullet list"
          disabled={disabled}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={disabled}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Align left"
          disabled={disabled}
          active={isEditorAlignmentActive(editor, "left")}
          onClick={() => setEditorAlignment(editor, "left")}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          disabled={disabled}
          active={isEditorAlignmentActive(editor, "center")}
          onClick={() => setEditorAlignment(editor, "center")}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          disabled={disabled}
          active={isEditorAlignmentActive(editor, "right")}
          onClick={() => setEditorAlignment(editor, "right")}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          disabled={disabled}
          active={isEditorAlignmentActive(editor, "justify")}
          onClick={() => setEditorAlignment(editor, "justify")}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Indent (Tab)"
          disabled={disabled}
          onClick={() => editor.chain().focus().indent().run()}
        >
          <IndentIncrease className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Outdent (Shift+Tab)"
          disabled={disabled}
          onClick={() => editor.chain().focus().outdent().run()}
        >
          <IndentDecrease className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Insert image"
          disabled={disabled || uploading}
          onClick={() => imageInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert equation" disabled={disabled} onClick={openMathDialog}>
          <Sigma className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        {uploading ? (
          <span className="ml-2 text-xs text-muted-foreground">Uploading…</span>
        ) : null}
      </div>
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void insertImageFile(e.target.files?.[0])}
      />
    </div>
    <MathEquationDialog
      open={mathOpen}
      initialLatex={mathDraft.latex}
      initialDisplay={mathDraft.display}
      onClose={() => setMathOpen(false)}
      onInsert={(latex, display) => applyEditorMath(editor, latex, display)}
    />
    </>
  );
}

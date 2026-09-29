"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Table as TableIcon, Trash2 } from "lucide-react";
import { setTableAlign, type TableAlign } from "@/lib/tiptap-movable-table";
import { cn } from "@/utils";

const TABLE_ALIGN_OPTIONS: { align: TableAlign; label: string; Icon: typeof AlignLeft }[] = [
  { align: "left", label: "Table left", Icon: AlignLeft },
  { align: "center", label: "Table center", Icon: AlignCenter },
  { align: "right", label: "Table right", Icon: AlignRight },
];

const GRID_ROWS = 8;
const GRID_COLS = 8;

/** Toolbar button that opens a click-to-pick size grid and inserts a table. */
export function TableInsertButton({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [hover, setHover] = useState({ rows: 3, cols: 3 });

  const close = () => setPos(null);

  const toggle = () => {
    if (pos) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 216;
    setHover({ rows: 3, cols: 3 });
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    });
  };

  useEffect(() => {
    if (!pos) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos]);

  const insert = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    close();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Insert table"
        title="Insert table"
        aria-expanded={Boolean(pos)}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
          pos && "bg-primary-muted text-primary"
        )}
      >
        <TableIcon className="h-4 w-4" />
      </button>
      {pos ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose table size"
          className="fixed z-[95] w-[216px] rounded-xl border border-border bg-card p-3 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="mb-2 text-xs font-semibold text-foreground">
            Insert table{" "}
            <span className="font-medium text-muted-foreground">
              {hover.rows} × {hover.cols}
            </span>
          </p>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => {
              const r = Math.floor(i / GRID_COLS) + 1;
              const c = (i % GRID_COLS) + 1;
              const on = r <= hover.rows && c <= hover.cols;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`${r} by ${c} table`}
                  onMouseEnter={() => setHover({ rows: r, cols: c })}
                  onFocus={() => setHover({ rows: r, cols: c })}
                  onClick={() => insert(r, c)}
                  className={cn(
                    "aspect-square rounded-[3px] border transition-colors",
                    on ? "border-primary bg-primary/20" : "border-border bg-muted/40"
                  )}
                />
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">First row is the header row.</p>
        </div>
      ) : null}
    </>
  );
}

function TableAction({
  label,
  onClick,
  disabled,
  active,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "text-accent hover:bg-accent/10"
          : active
            ? "bg-primary-muted text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** Row/column controls, shown only while the cursor is inside a table. */
export function TableContextBar({
  editor,
  disabled,
}: {
  editor: Editor;
  disabled?: boolean;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      inTable: ed.isActive("table"),
      headerRow: ed.isActive("tableHeader"),
      align: String(ed.getAttributes("table").align ?? "left"),
      canMerge: ed.can().mergeCells(),
      canSplit: ed.can().splitCell(),
    }),
  });

  if (!state?.inTable) return null;
  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) =>
    fn(editor.chain().focus()).run();

  return (
    <div className="flex w-full flex-wrap items-center gap-0.5 border-t border-border/70 pt-1.5">
      <span className="mr-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Table
      </span>
      <TableAction label="Add row above" disabled={disabled} onClick={() => run((c) => c.addRowBefore())}>
        + Row above
      </TableAction>
      <TableAction label="Add row below" disabled={disabled} onClick={() => run((c) => c.addRowAfter())}>
        + Row below
      </TableAction>
      <TableAction label="Add column left" disabled={disabled} onClick={() => run((c) => c.addColumnBefore())}>
        + Col left
      </TableAction>
      <TableAction label="Add column right" disabled={disabled} onClick={() => run((c) => c.addColumnAfter())}>
        + Col right
      </TableAction>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <TableAction label="Delete row" disabled={disabled} onClick={() => run((c) => c.deleteRow())}>
        − Row
      </TableAction>
      <TableAction label="Delete column" disabled={disabled} onClick={() => run((c) => c.deleteColumn())}>
        − Col
      </TableAction>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <TableAction
        label="Toggle header row"
        disabled={disabled}
        active={state.headerRow}
        onClick={() => run((c) => c.toggleHeaderRow())}
      >
        Header row
      </TableAction>
      <TableAction
        label="Merge selected cells"
        disabled={disabled || !state.canMerge}
        onClick={() => run((c) => c.mergeCells())}
      >
        Merge
      </TableAction>
      <TableAction
        label="Split cell"
        disabled={disabled || !state.canSplit}
        onClick={() => run((c) => c.splitCell())}
      >
        Split
      </TableAction>
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      {TABLE_ALIGN_OPTIONS.map(({ align, label, Icon }) => (
        <TableAction
          key={align}
          label={label}
          disabled={disabled}
          active={state.align === align}
          onClick={() => setTableAlign(editor, align)}
        >
          <Icon className="h-3.5 w-3.5" />
        </TableAction>
      ))}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <TableAction label="Delete table" danger disabled={disabled} onClick={() => run((c) => c.deleteTable())}>
        <Trash2 className="h-3.5 w-3.5" />
        Delete table
      </TableAction>
    </div>
  );
}

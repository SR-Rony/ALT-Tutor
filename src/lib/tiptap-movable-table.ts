import type { Editor } from "@tiptap/core";
import { Table, updateColumns } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView, ViewMutationRecord } from "@tiptap/pm/view";
import {
  applyBlockFrameLayout,
  clampBlockOffset,
  clampOffsetRatio,
  createBlockMover,
  parseBlockAlign,
  parseOffsetRatioFromElement,
  type BlockAlign,
} from "@/lib/tiptap-block-move";

function readTableLayout(attrs: Record<string, unknown>) {
  return {
    align: parseBlockAlign(attrs.align, "left"),
    offset: clampBlockOffset(Number(attrs.offset) || 0),
    ratio: clampOffsetRatio(attrs.offsetRatio),
  };
}

const GRIP_SVG =
  '<svg viewBox="0 0 6 14" width="6" height="14" aria-hidden="true" fill="currentColor">' +
  '<circle cx="1" cy="1.5" r="1"/><circle cx="5" cy="1.5" r="1"/>' +
  '<circle cx="1" cy="7" r="1"/><circle cx="5" cy="7" r="1"/>' +
  '<circle cx="1" cy="12.5" r="1"/><circle cx="5" cy="12.5" r="1"/></svg>';

/**
 * Table inside a movable frame: the grip on its left drags it left/right (snapping to
 * left / center / right) or up/down between lines, the same way display equations move.
 */
class MovableTableView implements NodeView {
  node: ProseMirrorNode;
  dom: HTMLDivElement;
  contentDOM: HTMLTableSectionElement;
  private frame: HTMLDivElement;
  private table: HTMLTableElement;
  private colgroup: HTMLTableColElement;
  private cellMinWidth: number;
  private mover: ReturnType<typeof createBlockMover>;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    editor: Editor,
    getPos: () => number | undefined,
  ) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;

    this.dom = document.createElement("div");
    this.dom.className = "qb-table-view";

    this.frame = document.createElement("div");
    this.frame.className = "qb-table-frame";
    this.frame.setAttribute("data-block-frame", "true");

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "qb-table-handle";
    handle.contentEditable = "false";
    handle.tabIndex = -1;
    handle.title = "Drag to move the table";
    handle.setAttribute("aria-label", "Move table");
    handle.innerHTML = GRIP_SVG;

    const scroller = document.createElement("div");
    scroller.className = "qb-table-scroller";

    this.table = scroller.appendChild(document.createElement("table"));
    this.colgroup = this.table.appendChild(document.createElement("colgroup"));
    updateColumns(node, this.colgroup, this.table, cellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement("tbody"));

    this.frame.append(handle, scroller);
    this.dom.appendChild(this.frame);
    this.applyLayout(node.attrs);

    this.mover = createBlockMover({
      editor,
      getPos,
      wrapper: this.dom,
      frame: this.frame,
      nodeName: node.type.name,
    });
    handle.addEventListener("pointerdown", (event) => this.mover.start(event, handle));
    handle.addEventListener("dragstart", (event) => event.preventDefault());
  }

  private applyLayout(attrs: Record<string, unknown>) {
    const { align, offset, ratio } = readTableLayout(attrs);
    applyBlockFrameLayout(this.frame, align, offset, null, ratio);
  }

  update(node: ProseMirrorNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    updateColumns(node, this.colgroup, this.table, this.cellMinWidth);
    if (!this.mover.isActive()) this.applyLayout(node.attrs);
    return true;
  }

  stopEvent(event: Event) {
    return event.target instanceof Element && Boolean(event.target.closest(".qb-table-handle"));
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (mutation.type === "selection") return false;
    return !this.contentDOM.contains(mutation.target);
  }

  destroy() {
    this.mover.destroy();
  }
}

/** Table with a saved position (`data-align` / `data-offset-ratio` on `<table>`). */
export const MovableTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "left" as BlockAlign,
        parseHTML: (element: HTMLElement) => parseBlockAlign(element.getAttribute("data-align"), "left"),
        renderHTML: (attributes: Record<string, unknown>) => {
          const { align, offset, ratio } = readTableLayout(attributes);
          if (align === "left") return {};
          if (align === "custom") {
            return {
              "data-align": "custom",
              "data-offset": String(offset),
              ...(ratio !== null ? { "data-offset-ratio": String(ratio) } : {}),
            };
          }
          return { "data-align": align };
        },
      },
      offset: {
        default: 0,
        parseHTML: (element: HTMLElement) =>
          clampBlockOffset(Number.parseFloat(element.getAttribute("data-offset") ?? "")),
        renderHTML: () => ({}),
      },
      offsetRatio: {
        default: null,
        parseHTML: (element: HTMLElement) => parseOffsetRatioFromElement(element),
        renderHTML: () => ({}),
      },
    };
  },

  addNodeView() {
    if (typeof document === "undefined") return null;
    const { cellMinWidth } = this.options;
    return ({ node, editor, getPos }) => new MovableTableView(node, cellMinWidth, editor, getPos);
  },
});

export type TableAlign = Exclude<BlockAlign, "custom">;

export function setTableAlign(editor: Editor, align: TableAlign): boolean {
  return editor
    .chain()
    .focus()
    .updateAttributes("table", { align, offset: 0, offsetRatio: null })
    .run();
}

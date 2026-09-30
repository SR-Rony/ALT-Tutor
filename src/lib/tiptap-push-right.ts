import { Mark, type Editor } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pushRight: {
      setPushRight: () => ReturnType;
      unsetPushRight: () => ReturnType;
    };
  }
}

/**
 * Floats part of a line to the right edge while the rest of the paragraph keeps its own
 * alignment (e.g. "What are the base units?            [2]").
 */
export const PushRight = Mark.create({
  name: "pushRight",

  parseHTML() {
    return [{ tag: "span.qb-push-right" }, { tag: "span[data-push-right]" }];
  },

  renderHTML() {
    return ["span", { class: "qb-push-right", "data-push-right": "true" }, 0];
  },

  addCommands() {
    return {
      setPushRight:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      unsetPushRight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name, { extendEmptyMarkRange: true }),
    };
  },
});

/** True when the selection is only part of the text of a single paragraph / heading. */
export function isPartialLineSelection(editor: Editor): boolean {
  const { selection } = editor.state;
  if (selection.empty) return false;
  const { $from, $to } = selection;
  if (!$from.sameParent($to) || !$from.parent.isTextblock) return false;
  const text = $from.parent.textContent;
  const selected = editor.state.doc.textBetween(selection.from, selection.to, "\n", "\n");
  return selected.trim().length > 0 && selected.trim() !== text.trim();
}

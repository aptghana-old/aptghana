import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: string) => ReturnType;
    };
  }
}

/**
 * A simple "callout" block — a styled, admonition-style paragraph container.
 * Modeled as a minimal custom node rather than pulling in a community
 * extension, since the only requirement is "a visually distinct note box".
 */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: { default: "info" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]", getAttrs: (el) => ({ variant: (el as HTMLElement).getAttribute("data-callout") || "info" }) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": HTMLAttributes.variant, class: `callout callout-${HTMLAttributes.variant}` }), 0];
  },

  addCommands() {
    return {
      setCallout: (variant = "info") => ({ commands }) => commands.wrapIn(this.name, { variant }),
    };
  },
});

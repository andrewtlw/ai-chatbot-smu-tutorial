"use client";

import MarkdownIt from "markdown-it";
import { MarkdownParser } from "prosemirror-markdown";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";

import { createSuggestionWidget, type UISuggestion } from "./suggestions";

// Create markdown-it instance with GFM table support
const md = new MarkdownIt("commonmark", { html: false }).enable("table");

// Lazy-initialized markdown parser to avoid circular dependency
let _markdownParser: MarkdownParser | null = null;

function getMarkdownParser() {
  if (!_markdownParser) {
    // Import documentSchema lazily to avoid circular dependency
    const { documentSchema } = require("./config");
    _markdownParser = new MarkdownParser(documentSchema, md, {
      blockquote: { block: "blockquote" },
      paragraph: { block: "paragraph" },
      list_item: { block: "list_item" },
      bullet_list: { block: "bullet_list" },
      ordered_list: { block: "ordered_list", getAttrs: (tok: any) => ({ order: +(tok.attrGet("start") || 1) }) },
      heading: { block: "heading", getAttrs: (tok: any) => ({ level: +tok.tag.slice(1) }) },
      code_block: { block: "code_block", noCloseToken: true },
      fence: { block: "code_block", getAttrs: (tok: any) => ({ params: tok.info || "" }), noCloseToken: true },
      hr: { node: "horizontal_rule" },
      image: { node: "image", getAttrs: (tok: any) => ({ src: tok.attrGet("src"), title: tok.attrGet("title") || null, alt: tok.children?.[0]?.content || null }) },
      hardbreak: { node: "hard_break" },
      // Table support - ignore thead/tbody wrappers, map tr/th/td to nodes
      table: { block: "table" },
      thead: { ignore: true },
      tbody: { ignore: true },
      tr: { block: "table_row" },
      th: { block: "table_header" },
      td: { block: "table_cell" },
      // Inline marks
      em: { mark: "em" },
      strong: { mark: "strong" },
      link: { mark: "link", getAttrs: (tok: any) => ({ href: tok.attrGet("href"), title: tok.attrGet("title") || null }) },
      code_inline: { mark: "code" },
    });
  }
  return _markdownParser;
}

export const buildDocumentFromContent = (content: string) => {
  // Import documentSchema lazily to avoid circular dependency
  const { documentSchema } = require("./config");
  try {
    // Use custom markdown parser with table support
    return getMarkdownParser().parse(content) || documentSchema.node("doc", null, [documentSchema.node("paragraph")]);
  } catch (error) {
    console.error("[buildDocumentFromContent] Error parsing content:", error);
    // Return an empty document on error
    return documentSchema.node("doc", null, [documentSchema.node("paragraph")]);
  }
};

export const createDecorations = (
  suggestions: UISuggestion[],
  view: EditorView
) => {
  const decorations: Decoration[] = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: "suggestion-highlight",
        },
        {
          suggestionId: suggestion.id,
          type: "highlight",
        }
      )
    );

    decorations.push(
      Decoration.widget(
        suggestion.selectionStart,
        (currentView) => {
          const { dom } = createSuggestionWidget(suggestion, currentView);
          return dom;
        },
        {
          suggestionId: suggestion.id,
          type: "widget",
        }
      )
    );
  }

  return DecorationSet.create(view.state.doc, decorations);
};

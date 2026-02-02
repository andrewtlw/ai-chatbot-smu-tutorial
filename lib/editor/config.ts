import { textblockTypeInputRule } from "prosemirror-inputrules";
import { defaultMarkdownSerializer, MarkdownSerializer } from "prosemirror-markdown";
import { Schema, type Node } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import type { Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { MutableRefObject } from "react";

// Create schema with list nodes and table nodes
const nodesWithLists = addListNodes(schema.spec.nodes, "paragraph block*", "block");

export const documentSchema = new Schema({
  nodes: nodesWithLists.append({
    table: {
      content: "table_row+",
      tableRole: "table",
      isolating: true,
      group: "block",
      parseDOM: [{ tag: "table" }],
      toDOM() {
        return ["table", { class: "prose-table" }, ["tbody", 0]];
      },
    },
    table_row: {
      content: "(table_cell | table_header)*",
      tableRole: "row",
      parseDOM: [{ tag: "tr" }],
      toDOM() {
        return ["tr", 0];
      },
    },
    table_cell: {
      content: "inline*",
      tableRole: "cell",
      isolating: true,
      parseDOM: [{ tag: "td" }],
      toDOM() {
        return ["td", 0];
      },
    },
    table_header: {
      content: "inline*",
      tableRole: "header_cell",
      isolating: true,
      parseDOM: [{ tag: "th" }],
      toDOM() {
        return ["th", 0];
      },
    },
  }),
  marks: schema.spec.marks,
});

export function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    documentSchema.nodes.heading,
    () => ({ level })
  );
}

// Custom markdown serializer with table support
const markdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    table(state, node) {
      // Serialize table to GFM markdown
      const rows: string[][] = [];
      node.forEach((row) => {
        const cells: string[] = [];
        row.forEach((cell) => {
          // Get text content of cell
          let cellText = "";
          cell.forEach((child) => {
            if (child.isText) {
              cellText += child.text || "";
            } else {
              cellText += defaultMarkdownSerializer.serialize(cell);
            }
          });
          cells.push(cellText.trim());
        });
        rows.push(cells);
      });

      if (rows.length === 0) return;

      // Build markdown table
      const colCount = Math.max(...rows.map((r) => r.length));

      // First row is header
      const headerRow = rows[0] || [];
      state.write("| " + headerRow.map((c) => c || " ").join(" | ") + " |\n");

      // Separator row
      state.write("| " + Array(colCount).fill("---").join(" | ") + " |\n");

      // Data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        state.write("| " + row.map((c) => c || " ").join(" | ") + " |\n");
      }

      state.closeBlock(node);
    },
    table_row(state, node) {
      // Handled by table serializer
    },
    table_cell(state, node) {
      // Handled by table serializer
    },
    table_header(state, node) {
      // Handled by table serializer
    },
  },
  defaultMarkdownSerializer.marks
);

export const buildContentFromDocument = (document: Node) => {
  return markdownSerializer.serialize(document);
};

export const handleTransaction = ({
  transaction,
  editorRef,
  onSaveContent,
}: {
  transaction: Transaction;
  editorRef: MutableRefObject<EditorView | null>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
}) => {
  if (!editorRef || !editorRef.current) {
    return;
  }

  const newState = editorRef.current.state.apply(transaction);
  editorRef.current.updateState(newState);

  if (transaction.docChanged && !transaction.getMeta("no-save")) {
    const updatedContent = buildContentFromDocument(newState.doc);

    if (transaction.getMeta("no-debounce")) {
      onSaveContent(updatedContent, false);
    } else {
      onSaveContent(updatedContent, true);
    }
  }
};

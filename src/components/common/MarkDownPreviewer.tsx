import React from "react";

// Simple markdown parser utilities (covers common patterns)
const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const processInline = (text: string) => {
  let result = escapeHtml(text);

  // Bold
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic
  result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Inline code
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  return result;
};

export const parseMarkdown = (text: string) => {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentList: { type: string; items: string[] } | null = null;
  let currentBlockquote: string[] | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(
        `<pre><code class="language-${lang || "plaintext"}">${escapeHtml(
          codeLines.join("\n"),
        )}</code></pre>`,
      );
      i++;
      continue;
    }

    // Headers
    if (line.startsWith("#### ")) {
      blocks.push(`<h6>${processInline(line.slice(5))}</h6>`);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(`<h5>${processInline(line.slice(4))}</h5>`);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h4>${processInline(line.slice(3))}</h4>`);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h3>${processInline(line.slice(2))}</h3>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      blocks.push("<hr>");
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      if (!currentBlockquote) {
        currentBlockquote = [];
      }
      currentBlockquote.push(processInline(line.slice(2)));
      i++;
      continue;
    } else if (currentBlockquote) {
      blocks.push(`<blockquote>${currentBlockquote.join("<br>")}</blockquote>`);
      currentBlockquote = null;
    }

    // Lists
    if (line.match(/^[\-\*] /)) {
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(processInline(line.slice(2)));
      i++;
      continue;
    } else if (line.match(/^\d+\. /)) {
      if (!currentList || currentList.type !== "ol") {
        if (currentList) {
          blocks.push(
            `<${currentList.type}>${currentList.items
              .map((item) => `<li>${item}</li>`)
              .join("")}</${currentList.type}>`,
          );
        }
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(processInline(line.replace(/^\d+\. /, "")));
      i++;
      continue;
    } else if (currentList) {
      blocks.push(
        `<${currentList.type}>${currentList.items
          .map((item) => `<li>${item}</li>`)
          .join("")}</${currentList.type}>`,
      );
      currentList = null;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Table
    if (line.includes("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const tableHtml = tableLines
        .map((tLine) => {
          const cells = tLine
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim());
          return (
            "<tr>" +
            cells.map((cell) => `<td>${processInline(cell)}</td>`).join("") +
            "</tr>"
          );
        })
        .join("");
      blocks.push(`<table>${tableHtml}</table>`);
      continue;
    }

    // Regular paragraph
    blocks.push(`<p>${processInline(line)}</p>`);
    i++;
  }

  // Close any remaining blockquote or list
  if (currentBlockquote) {
    blocks.push(`<blockquote>${currentBlockquote.join("<br>")}</blockquote>`);
  }
  if (currentList) {
    blocks.push(
      `<${currentList.type}>${currentList.items
        .map((item) => `<li>${item}</li>`)
        .join("")}</${currentList.type}>`,
    );
  }

  return blocks.join("");
};

const MarkdownPreviewer: React.FC<{ markdown: string }> = ({ markdown }) => {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
      className="markdown-preview"
    />
  );
};

export default MarkdownPreviewer;

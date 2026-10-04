import sanitizeHtml from "sanitize-html";

export function RichContent({ html }: { html: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "pre",
      "code",
    ],
    allowedAttributes: {
      a: ["href", "title", "rel"],
      img: ["src", "alt", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "nofollow noopener noreferrer",
      }),
    },
  });
  return (
    <div className="rich-content" dangerouslySetInnerHTML={{ __html: clean }} />
  );
}

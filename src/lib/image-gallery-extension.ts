import { Node } from "@tiptap/react";
import { galleryFromElement, normalizeGallery } from "./image-gallery";

export const ImageGallery = Node.create({
  name: "imageGallery",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      title: { default: "", rendered: false },
      columns: { default: 3, rendered: false },
      images: { default: [], rendered: false },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'figure[data-kkr-gallery="1"]',
        getAttrs: (element) => galleryFromElement(element),
      },
    ];
  },
  renderHTML({ node }) {
    const gallery = normalizeGallery(node.attrs);
    return [
      "figure",
      { "data-kkr-gallery": "1", "data-columns": String(gallery.columns) },
      ...gallery.images.map((image) => [
        "a",
        { href: image.src, title: image.alt || "نمایش تصویر بزرگ‌تر" },
        ["img", { src: image.src, alt: image.alt, loading: "lazy" }],
      ]),
      ...(gallery.title ? [["figcaption", {}, gallery.title]] : []),
    ];
  },
});

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Unlink,
  ImagePlus,
  Quote,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { mediaUrl, safeHref } from "@/lib/shared";
import { errorMessage } from "@/lib/errors";
import { useEffect, useRef, useState } from "react";
import type { Entity } from "@/lib/types";

export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ["https", "http"] },
      }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose-editor", "aria-label": "ویرایش متن" },
    },
  });
  useEffect(() => {
    if (editor && editor.getHTML() !== value)
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  async function upload(image: File) {
    const body = new FormData();
    body.set("file", image);
    body.set("alt", image.name);
    setError("");
    try {
      const { data } = await api<Entity>("/api/v1/admin/media", {
        method: "POST",
        body,
      });
      editor
        ?.chain()
        .focus()
        .setImage({ src: mediaUrl(data), alt: image.name })
        .run();
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  if (!editor)
    return <div className="editor-skeleton">در حال آماده‌سازی ویرایشگر…</div>;
  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          title="پررنگ"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={17} />
        </button>
        <button
          type="button"
          title="مورب"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={17} />
        </button>
        <button
          type="button"
          title="عنوان"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          عنوان
        </button>
        <button
          type="button"
          title="فهرست"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={17} />
        </button>
        <button
          type="button"
          title="فهرست شماره‌دار"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={17} />
        </button>
        <button
          type="button"
          title="نقل قول"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={17} />
        </button>
        <button
          type="button"
          title="لینک"
          onClick={() => {
            const href = prompt(
              "نشانی لینک",
              String(editor.getAttributes("link").href || ""),
            );
            if (href && safeHref(href))
              editor
                .chain()
                .focus()
                .setLink({ href: safeHref(href)! })
                .run();
          }}
        >
          <LinkIcon size={17} />
        </button>
        <button
          type="button"
          title="حذف لینک"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink size={17} />
        </button>
        <button
          type="button"
          title="افزودن تصویر"
          onClick={() => file.current?.click()}
        >
          <ImagePlus size={17} />
        </button>
        <button
          type="button"
          title="بازگشت"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          title="انجام دوباره"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={17} />
        </button>
        <input
          ref={file}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (chosen) void upload(chosen);
            event.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

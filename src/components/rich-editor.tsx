"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
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
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(6);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          protocols: ["https", "http"],
        },
      }),
      Image,
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-editor",
        "aria-label": "ویرایش متن",
      },
    },
  });

  const tableState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      active: editor?.isActive("table") ?? false,
    }),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  async function upload(image: File) {
    if (!editor || editor.isDestroyed || uploadLock.current) return;

    setError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      setError("فقط تصاویر JPEG، PNG و WebP پذیرفته می‌شوند.");
      return;
    }

    if (image.size > 4 * 1024 * 1024) {
      setError(
        "برای بارگذاری از مسیر ورسل، حجم تصویر باید حداکثر ۴ مگابایت باشد.",
      );
      return;
    }

    uploadLock.current = true;
    setUploading(true);

    const body = new FormData();
    body.set("file", image);
    body.set("alt", image.name);

    try {
      const { data } = await api<Entity>("/api/v1/admin/media", {
        method: "POST",
        body,
      });

      if (editor.isDestroyed) return;

      const src = mediaUrl(data);

      if (!src) {
        throw new Error("نشانی تصویر بارگذاری‌شده معتبر نیست.");
      }

      const inserted = editor
        .chain()
        .insertContentAt(
          editor.state.doc.content.size,
          [
            {
              type: "image",
              attrs: {
                src,
                alt: image.name,
              },
            },
            { type: "paragraph" },
          ],
          { updateSelection: true },
        )
        .focus()
        .run();

      if (!inserted) {
        throw new Error("تصویر بارگذاری شد، اما درج آن در متن انجام نشد.");
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      uploadLock.current = false;

      if (!editor.isDestroyed) {
        setUploading(false);
      }
    }
  }

  if (!editor) {
    return (
      <div className="editor-skeleton">
        در حال آماده‌سازی ویرایشگر…
      </div>
    );
  }

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

            if (href && safeHref(href)) {
              editor
                .chain()
                .focus()
                .setLink({ href: safeHref(href)! })
                .run();
            }
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
          disabled={uploading}
          aria-label={uploading ? "در حال بارگذاری تصویر" : "افزودن تصویر"}
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
          disabled={uploading}
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const chosen = event.target.files?.[0];

            if (chosen) {
              void upload(chosen);
            }

            event.target.value = "";
          }}
        />
      </div>

      <div className="table-editor-tools" aria-label="ابزارهای جدول">
        <div className="table-create-controls">
          <label>
            سطر
            <input
              type="number"
              min={1}
              max={50}
              value={rows}
              onChange={(event) => setRows(Number(event.target.value))}
            />
          </label>

          <label>
            ستون
            <input
              type="number"
              min={1}
              max={12}
              value={columns}
              onChange={(event) => setColumns(Number(event.target.value))}
            />
          </label>

          <button
            type="button"
            className="secondary-button"
            disabled={uploading}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (
                !Number.isInteger(rows) ||
                !Number.isInteger(columns) ||
                rows < 1 ||
                rows > 50 ||
                columns < 1 ||
                columns > 12
              ) {
                setError("تعداد سطر باید بین ۱ تا ۵۰ و ستون بین ۱ تا ۱۲ باشد.");
                return;
              }

              setError("");

              const inserted = editor
                .chain()
                .focus()
                .insertTable({
                  rows,
                  cols: columns,
                  withHeaderRow: true,
                })
                .run();

              if (!inserted) {
                setError("درج جدول در محل انتخاب‌شده انجام نشد.");
              }
            }}
          >
            افزودن جدول
          </button>
        </div>

        <div className="table-action-controls">
          {[
            {
              label: "سطر قبل",
              run: () => editor.chain().focus().addRowBefore().run(),
            },
            {
              label: "سطر بعد",
              run: () => editor.chain().focus().addRowAfter().run(),
            },
            {
              label: "حذف سطر",
              run: () => editor.chain().focus().deleteRow().run(),
            },
            {
              label: "ستون قبل",
              run: () => editor.chain().focus().addColumnBefore().run(),
            },
            {
              label: "ستون بعد",
              run: () => editor.chain().focus().addColumnAfter().run(),
            },
            {
              label: "حذف ستون",
              run: () => editor.chain().focus().deleteColumn().run(),
            },
            {
              label: "ادغام سلول‌ها",
              run: () => editor.chain().focus().mergeCells().run(),
            },
            {
              label: "تفکیک سلول",
              run: () => editor.chain().focus().splitCell().run(),
            },
            {
              label: "سطر عنوان",
              run: () => editor.chain().focus().toggleHeaderRow().run(),
            },
            {
              label: "ستون عنوان",
              run: () => editor.chain().focus().toggleHeaderColumn().run(),
            },
            {
              label: "حذف جدول",
              run: () => editor.chain().focus().deleteTable().run(),
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={!tableState?.active || uploading}
              onMouseDown={(event) => event.preventDefault()}
              onClick={action.run}
            >
              {action.label}
            </button>
          ))}
        </div>

        <p className="table-editor-hint">
          برای ویرایش جدول روی سلول کلیک کنید. برای ادغام، چند سلول را انتخاب
          کنید. جدول را از Word یا صفحه وب نیز می‌توانید کپی و اینجا جای‌گذاری
          کنید.
        </p>
      </div>

      <EditorContent editor={editor} />

      {uploading && (
        <p role="status">
          در حال بارگذاری تصویر؛ پس از پایان، مطلب را ذخیره کنید.
        </p>
      )}

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
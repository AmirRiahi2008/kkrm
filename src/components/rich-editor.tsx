"use client";

import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { ImageGallery } from "@/lib/image-gallery-extension";
import { normalizeGallery } from "@/lib/image-gallery";
import type { ImageGalleryData } from "@/lib/image-gallery";
import { GalleryEditorDialog } from "./gallery-editor-dialog";
import "@/app/inline-gallery.css";
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
  Images,
  FilePlus2,
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
  const pdfFile = useRef<HTMLInputElement>(null);
  const pdfBookmark = useRef<ReturnType<
    Editor["state"]["selection"]["getBookmark"]
  > | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const galleryBookmark = useRef<ReturnType<
    Editor["state"]["selection"]["getBookmark"]
  > | null>(null);
  const [galleryDialog, setGalleryDialog] = useState<{
    initial: ImageGalleryData;
    editing: boolean;
  } | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
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
      ImageGallery,
      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
    onTransaction: ({ transaction }) => {
      if (pdfBookmark.current) {
        pdfBookmark.current = pdfBookmark.current.map(transaction.mapping);
      }
      if (galleryBookmark.current) {
        galleryBookmark.current = galleryBookmark.current.map(
          transaction.mapping,
        );
      }
    },
    editorProps: {
      handleDOMEvents: {
        click: (view, event) => {
          if (!(event.target instanceof Element)) return false;
          const figure = event.target.closest('figure[data-kkr-gallery="1"]');
          if (!figure || !view.dom.contains(figure)) return false;
          event.preventDefault();
          const position = view.posAtDOM(figure, 0);
          editorRef.current?.commands.setNodeSelection(position);
          view.focus();
          return true;
        },
      },
      attributes: {
        class: "prose-editor",
        "aria-label": "ویرایش متن",
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const tableState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      active: editor?.isActive("table") ?? false,
      gallery: editor?.isActive("imageGallery") ?? false,
    }),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  function openGallery() {
    if (!editor || editor.isDestroyed || uploading) return;
    galleryBookmark.current = editor.state.selection.getBookmark();
    const editing = editor.isActive("imageGallery");
    setGalleryDialog({
      initial: normalizeGallery(
        editing ? editor.getAttributes("imageGallery") : null,
      ),
      editing,
    });
  }

  function closeGallery() {
    galleryBookmark.current = null;
    setGalleryDialog(null);
    editor?.commands.focus();
  }

  function saveGallery(gallery: ImageGalleryData): boolean {
    if (
      !editor ||
      editor.isDestroyed ||
      !galleryBookmark.current ||
      !gallery.images.length
    )
      return false;
    try {
      const selection = galleryBookmark.current.resolve(editor.state.doc);
      const restored = editor.chain().command(({ tr }) => {
        tr.setSelection(selection);
        return true;
      });
      const inserted = galleryDialog?.editing
        ? restored.updateAttributes("imageGallery", gallery).run()
        : restored
            .insertContent({ type: "imageGallery", attrs: gallery })
            .run();
      if (!inserted) return false;
      closeGallery();
      return true;
    } catch {
      return false;
    }
  }

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

  async function uploadPdf(document: File) {
    if (!editor || editor.isDestroyed || uploadLock.current) return;
    setError("");
    const pdfType = ["application/pdf", "application/x-pdf"].includes(
      document.type,
    );
    if (!pdfType && !(document.type === "" && /\.pdf$/i.test(document.name))) {
      pdfBookmark.current = null;
      setError("برای این گزینه فقط فایل PDF انتخاب کنید.");
      return;
    }
    if (!document.size || document.size > 4 * 1024 * 1024) {
      pdfBookmark.current = null;
      setError("فایل PDF باید خالی نباشد و حجم آن حداکثر ۴ مگابایت باشد.");
      return;
    }
    pdfBookmark.current ??= editor.state.selection.getBookmark();
    uploadLock.current = true;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", document);
      body.set("alt", document.name.slice(0, 250));
      const { data } = await api<Entity>("/api/v1/admin/media", {
        method: "POST",
        body,
      });
      if (editor.isDestroyed) return;
      const href = mediaUrl(data);
      if (!href || data.mime_type !== "application/pdf") {
        throw new Error("فایل بارگذاری‌شده یک PDF معتبر نیست.");
      }
      const selection = pdfBookmark.current.resolve(editor.state.doc);
      const label = document.name.replace(/\.pdf$/i, "").trim() || "فایل پیوست";
      const inserted = editor
        .chain()
        .command(({ tr }) => {
          tr.setSelection(selection);
          return true;
        })
        .insertContent([
          {
            type: "text",
            text: `دریافت PDF: ${label}`,
            marks: [
              {
                type: "link",
                attrs: { href, target: "_blank", rel: "noopener noreferrer" },
              },
            ],
          },
          { type: "text", text: " " },
        ])
        .focus()
        .run();
      if (!inserted) {
        throw new Error("فایل بارگذاری شد، اما درج لینک PDF در متن انجام نشد.");
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      pdfBookmark.current = null;
      uploadLock.current = false;
      if (!editor.isDestroyed) setUploading(false);
    }
  }

  if (!editor) {
    return <div className="editor-skeleton">در حال آماده‌سازی ویرایشگر…</div>;
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
          title="افزودن فایل PDF در محل نشانگر"
          disabled={uploading}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            pdfBookmark.current = editor.state.selection.getBookmark();
            pdfFile.current?.click();
          }}
        >
          <FilePlus2 size={17} />
          افزودن PDF
        </button>

        <button
          type="button"
          title={
            tableState?.gallery
              ? "ویرایش آلبوم انتخاب‌شده"
              : "افزودن آلبوم تصاویر"
          }
          aria-pressed={tableState?.gallery ?? false}
          disabled={uploading}
          onMouseDown={(event) => event.preventDefault()}
          onClick={openGallery}
        >
          <Images size={17} />
          {tableState?.gallery ? "ویرایش آلبوم" : "آلبوم تصاویر"}
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
          ref={pdfFile}
          type="file"
          hidden
          disabled={uploading}
          accept="application/pdf,.pdf"
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            if (chosen) void uploadPdf(chosen);
            event.target.value = "";
          }}
        />

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
      <p className="inline-gallery-editor-help">
        برای ویرایش آلبوم، روی آن کلیک کنید و «ویرایش آلبوم» را بزنید. برای حذف
        آلبوم انتخاب‌شده، کلید Delete را بزنید.
      </p>
      {galleryDialog && (
        <GalleryEditorDialog
          initial={galleryDialog.initial}
          editing={galleryDialog.editing}
          onSave={saveGallery}
          onClose={closeGallery}
        />
      )}

      {uploading && (
        <p role="status">
          در حال بارگذاری فایل؛ پس از پایان، مطلب را ذخیره کنید.
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

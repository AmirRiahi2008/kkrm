"use client";

import { useCallback, useState } from "react";
import { ImageLightbox } from "./image-lightbox";
import { galleryFromElement } from "@/lib/image-gallery";
import type { ImageGalleryData } from "@/lib/image-gallery";
import "@/app/inline-gallery.css";

export function RichContentViewer({ html }: { html: string }) {
  const [selection, setSelection] = useState<{
    gallery: ImageGalleryData;
    index: number;
  } | null>(null);
  const close = useCallback(() => setSelection(null), []);

  return (
    <>
      <div
        className="rich-content"
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={(event) => {
          if (!(event.target instanceof Element)) return;
          const anchor = event.target.closest(
            'figure[data-kkr-gallery="1"] > a',
          );
          if (!anchor || !event.currentTarget.contains(anchor)) return;
          const figure = anchor.parentElement;
          if (!figure) return;
          const gallery = galleryFromElement(figure);
          const anchors = Array.from(figure.querySelectorAll(":scope > a"));
          const index = anchors.indexOf(anchor);
          if (
            !gallery.images.length ||
            index < 0 ||
            index >= gallery.images.length
          )
            return;
          event.preventDefault();
          setSelection({ gallery, index });
        }}
      />
      {selection && (
        <ImageLightbox
          gallery={selection.gallery}
          initialIndex={selection.index}
          onClose={close}
        />
      )}
    </>
  );
}

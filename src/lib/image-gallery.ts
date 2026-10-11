export type GalleryImage = {
  src: string;
  alt: string;
};

export type ImageGalleryData = {
  title: string;
  columns: 2 | 3 | 4;
  images: GalleryImage[];
};

export const MAX_GALLERY_IMAGES = 40;
export const MAX_GALLERY_IMAGE_BYTES = 4 * 1024 * 1024;

export function galleryImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const src = value.trim();
  if (!src || /[\\\u0000-\u0020\u007f]/.test(src)) return null;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeGallery(value: unknown): ImageGalleryData {
  const data =
    value && typeof value === "object"
      ? (value as Partial<ImageGalleryData>)
      : {};
  const images: GalleryImage[] = [];
  if (Array.isArray(data.images)) {
    for (const image of data.images.slice(0, MAX_GALLERY_IMAGES)) {
      if (!image || typeof image !== "object") continue;
      const src = galleryImageUrl(image.src);
      if (src) images.push({ src, alt: String(image.alt || "").slice(0, 250) });
    }
  }
  return {
    title: typeof data.title === "string" ? data.title.slice(0, 150) : "",
    columns: data.columns === 2 || data.columns === 4 ? data.columns : 3,
    images,
  };
}

export function galleryFromElement(element: Element): ImageGalleryData {
  const images = Array.from(element.querySelectorAll(":scope > a > img")).map(
    (image) => ({
      src: image.getAttribute("src") || "",
      alt: image.getAttribute("alt") || "",
    }),
  );
  return normalizeGallery({
    title: element.querySelector(":scope > figcaption")?.textContent || "",
    columns: Number(element.getAttribute("data-columns")),
    images,
  });
}

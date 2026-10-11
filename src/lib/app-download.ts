export const DIRECT_APP_DOWNLOAD_URL = "";

export function directAppDownloadUrl(): string | null {
  const value = DIRECT_APP_DOWNLOAD_URL.trim();
  if (!value || /[\\\u0000-\u001f]/.test(value)) return null;
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

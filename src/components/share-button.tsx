"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("لینک کپی شد.");
    } catch {
      setManualUrl(url);
      setMessage("لینک زیر را کپی کنید.");
    }
  }

  async function share() {
    if (busy) return;

    setBusy(true);
    setMessage("");
    setManualUrl("");

    try {
      const url = new URL(window.location.href);
      url.hash = "";

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title,
            url: url.href,
          });

          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }
        }
      }

      await copyLink(url.href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-actions">
      <button
        type="button"
        className="primary-button share-button"
        onClick={share}
        disabled={busy}
      >
        <Share2 size={18} aria-hidden="true" />
        {busy ? "در حال آماده‌سازی…" : "اشتراک‌گذاری"}
      </button>

      <span role="status" aria-live="polite">
        {message}
      </span>

      {manualUrl && (
        <label className="share-url">
          لینک صفحه
          <input
            type="text"
            value={manualUrl}
            readOnly
            dir="ltr"
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
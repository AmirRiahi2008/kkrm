"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({
  title = "",
  url,
}: {
  title?: string;
  url?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function share() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const destination = url
        ? new URL(url, window.location.origin)
        : new URL(window.location.href);
      if (
        !["https:", "http:"].includes(destination.protocol) ||
        destination.username ||
        destination.password
      ) {
        throw new Error("نشانی اشتراک‌گذاری معتبر نیست.");
      }
      if (navigator.share) {
        await navigator.share({
          title: title || document.title,
          url: destination.href,
        });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(destination.href);
        setMessage("لینک صفحه کپی شد.");
      } else {
        window.prompt("لینک صفحه را کپی کنید:", destination.href);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setMessage("اشتراک‌گذاری انجام نشد. دوباره تلاش کنید.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="share-button"
        disabled={busy}
        onClick={() => void share()}
      >
        <Share2 size={18} />
        {busy ? "در حال اشتراک‌گذاری…" : "اشتراک‌گذاری"}
      </button>
      {message && (
        <p role="status" className="share-status">
          {message}
        </p>
      )}
    </div>
  );
}

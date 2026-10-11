"use client";

import { api } from "@/lib/api-client";
import { formatAdminDate } from "@/lib/admin-date";
import { errorMessage } from "@/lib/errors";
import { faNumber } from "@/lib/shared";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  FileCheck2,
  Inbox,
  MessageSquare,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export interface AdminNotice {
  id: string;
  title: string;
  message: string;
  url: string;
  kind: string;
  read_at: string | null;
  created_at: string;
}
export interface NotificationData {
  items: AdminNotice[];
  unread_count: number;
}
export function NotificationCenter({ initial }: { initial: NotificationData }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await api<NotificationData>(
        "/api/v1/admin/notifications",
        { signal },
      );
      setData(result.data);
      setError("");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setError(errorMessage(error));
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh(controller.signal);
    }, 60000);
    function close(event: PointerEvent) {
      if (panel.current?.open && !panel.current.contains(event.target as Node))
        panel.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && panel.current) panel.current.open = false;
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [refresh]);
  async function readAll() {
    setBusy(true);
    try {
      await api("/api/v1/admin/notifications/read-all", { method: "PATCH" });
      setData((current) => ({
        unread_count: 0,
        items: current.items.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        })),
      }));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function visit(item: AdminNotice) {
    if (
      !item.url.startsWith("/admin/") ||
      item.url.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(item.url)
    )
      return;
    if (!item.read_at) {
      try {
        await api(
          "/api/v1/admin/notifications/" +
            encodeURIComponent(item.id) +
            "/read",
          { method: "PATCH" },
        );
        setData((current) => ({
          unread_count: Math.max(0, current.unread_count - 1),
          items: current.items.map((notice) =>
            notice.id === item.id
              ? { ...notice, read_at: new Date().toISOString() }
              : notice,
          ),
        }));
      } catch (error) {
        setError(errorMessage(error));
        return;
      }
    }
    if (panel.current) panel.current.open = false;
    router.push(item.url);
  }
  return (
    <details
      ref={panel}
      className="notification-center"
      onToggle={(event) => {
        if (event.currentTarget.open) void refresh();
      }}
    >
      <summary
        aria-label={"اعلان‌ها، " + faNumber(data.unread_count) + " خوانده‌نشده"}
      >
        <Bell size={20} />
        {data.unread_count > 0 && (
          <span className="notice-count">
            {faNumber(data.unread_count > 99 ? 99 : data.unread_count)}
          </span>
        )}
      </summary>
      <div className="notification-panel">
        <div className="notification-heading">
          <div>
            <strong>اعلان‌ها</strong>
            <small>{faNumber(data.unread_count)} اعلان خوانده‌نشده</small>
          </div>
          <button
            type="button"
            aria-label="بستن اعلان‌ها"
            onClick={() => {
              if (panel.current) panel.current.open = false;
            }}
          >
            <X size={17} />
          </button>
        </div>
        {data.unread_count > 0 && (
          <button
            type="button"
            className="mark-read-all"
            disabled={busy}
            onClick={() => void readAll()}
          >
            <CheckCheck size={16} />
            همه را خواندم
          </button>
        )}
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        <div className="notification-items">
          {data.items.length ? (
            data.items.map((item) => (
              <button
                type="button"
                key={item.id}
                className={
                  "notification-item" + (item.read_at ? "" : " unread")
                }
                onClick={() => void visit(item)}
              >
                <span className="notice-icon">
                  {item.kind === "message" ? (
                    <MessageSquare size={19} />
                  ) : item.kind === "published" ? (
                    <CheckCircle2 size={19} />
                  ) : (
                    <FileCheck2 size={19} />
                  )}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <time>{formatAdminDate(item.created_at)}</time>
                </span>
                {!item.read_at && <i className="unread-dot" />}
              </button>
            ))
          ) : (
            <div className="notice-empty">
              <Inbox size={32} />
              <strong>همه چیز مرتب است</strong>
              <p>پیام‌های جدید و مطالب آماده بررسی اینجا نمایش داده می‌شوند.</p>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

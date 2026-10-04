"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, RotateCcw, Plus } from "lucide-react";
import { resources } from "@/lib/admin-resources";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { title, text, date, faNumber, statusLabels } from "@/lib/shared";
import { Pages, Empty } from "./common";
import type { Entity, Pagination, User } from "@/lib/types";

export function AdminTable({
  resource,
  items,
  pagination,
  query,
  user,
}: {
  resource: string;
  items: Entity[];
  pagination?: Pagination;
  query: string;
  user: User;
}) {
  const config = resources[resource];
  const params = new URLSearchParams(query);
  const trash = params.get("trash") === "1";
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  async function mutate(item: Entity, restore: boolean) {
    if (!restore && !confirm("«" + title(item) + "» حذف شود؟")) return;
    setBusy(item.id);
    setError("");
    try {
      await api(
        "/api/v1/admin/" +
          resource +
          "/" +
          item.id +
          (restore ? "/restore" : ""),
        { method: restore ? "POST" : "DELETE" },
      );
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>{config.label}</h1>
          <p>{faNumber(pagination?.total || items.length)} مورد</p>
        </div>
        {!config.readOnly && !config.noCreate && (
          <Link
            prefetch={false}
            href={"/admin/" + resource + "/new"}
            className="primary-button"
          >
            <Plus size={17} />
            افزودن
          </Link>
        )}
      </div>
      <form className="filter-bar" action={"/admin/" + resource}>
        <label>
          جستجو
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            maxLength={150}
          />
        </label>
        {config.fields.find((field) => field.key === "type")?.options && (
          <label>
            نوع
            <select name="type" defaultValue={params.get("type") || ""}>
              <option value="">همه</option>
              {Object.entries(
                config.fields.find((field) => field.key === "type")!.options!,
              ).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
        {resource === "posts" && (
          <label>
            وضعیت
            <select name="status" defaultValue={params.get("status") || ""}>
              <option value="">همه</option>
              {["draft", "review", "published", "archived"].map((key) => (
                <option key={key} value={key}>
                  {statusLabels[key]}
                </option>
              ))}
            </select>
          </label>
        )}
        {!config.noTrash && user.role !== "editor" && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="trash"
              value="1"
              defaultChecked={trash}
            />
            سطل زباله
          </label>
        )}
        <button className="primary-button">نمایش</button>
        <Link prefetch={false} href={"/admin/" + resource}>
          پاک کردن
        </Link>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {items.length ? (
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>عنوان</th>
                <th>وضعیت / نوع</th>
                <th>تاریخ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{faNumber(item.id)}</td>
                  <td>
                    <strong>{title(item) || text(item.action)}</strong>
                    {item.email && <small>{text(item.email)}</small>}
                    {resource === "audit-logs" && (
                      <small>
                        {text(item.subject_type)} · {text(item.subject_id)}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className={"status-badge " + text(item.status)}>
                      {statusLabels[text(item.status)] ||
                        text(item.type || item.role) ||
                        (item.is_active === undefined
                          ? "—"
                          : item.is_active
                            ? "فعال"
                            : "غیرفعال")}
                    </span>
                  </td>
                  <td>{date(item.updated_at || item.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      {config.readOnly ? (
                        <details>
                          <summary>جزئیات</summary>
                          <pre dir="ltr">
                            {JSON.stringify(item.metadata, null, 2)}
                          </pre>
                          <span>کاربر: {text(item.actor_id)}</span>
                        </details>
                      ) : trash ? (
                        <button
                          disabled={busy === item.id}
                          onClick={() => mutate(item, true)}
                        >
                          <RotateCcw size={17} />
                          بازیابی
                        </button>
                      ) : (
                        <>
                          {(user.role !== "editor" ||
                            ["draft", "review"].includes(
                              text(item.status),
                            )) && (
                            <Link
                              prefetch={false}
                              href={"/admin/" + resource + "/" + item.id}
                              aria-label={"ویرایش " + title(item)}
                            >
                              <Pencil size={17} />
                              ویرایش
                            </Link>
                          )}
                          {!config.noDelete &&
                            (user.role !== "editor" ||
                              item.status === "draft") && (
                              <button
                                className="danger-link"
                                disabled={busy === item.id}
                                onClick={() => mutate(item, false)}
                                aria-label={"حذف " + title(item)}
                              >
                                <Trash2 size={17} />
                                حذف
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty />
      )}
      <Pages
        pagination={pagination}
        path={"/admin/" + resource}
        query={params}
      />
    </>
  );
}

import { formatAdminDate } from "@/lib/admin-date";
import { AdminTable } from "@/components/admin-table";
import { MediaLibrary } from "@/components/media-library";
import { ResourceForm } from "@/components/resource-form";
import { PageBuilder } from "@/components/page-builder";
import { RichContent } from "@/components/rich-content";
import { SecurityForm } from "@/components/security-form";
import { SettingsForm } from "@/components/settings-form";
import { canAccess, resources } from "@/lib/admin-resources";
import { currentUser, serverApi } from "@/lib/api-server";
import { ApiError } from "@/lib/errors";
import { entityPath, text, title } from "@/lib/shared";
import type { Entity, SearchParams, Value } from "@/lib/types";
import { notFound, redirect } from "next/navigation";

async function readAdmin<T>(path: string) {
  try {
    return await serverApi<T>(path, true);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/admin/login");
    if (error instanceof ApiError && [403, 404].includes(error.status))
      notFound();
    throw error;
  }
}
async function all(resource: string, admin = true): Promise<Entity[]> {
  const prefix = "/api/v1/" + (admin ? "admin/" : "") + resource;
  const read = (path: string) =>
    admin ? readAdmin<Entity[]>(path) : serverApi<Entity[]>(path);
  const first = await read(prefix + "?per_page=50");
  const pages = await Promise.all(
    Array.from(
      {
        length: Math.max(0, Math.min(first.pagination?.last_page || 1, 40) - 1),
      },
      (_, i) => read(prefix + "?per_page=50&page=" + (i + 2)),
    ),
  );
  return [...first.data, ...pages.flatMap((page) => page.data)];
}
export default async function AdminResource({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string; action?: string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const { resource, action = [] } = await params;
  const user = await currentUser();
  if (!canAccess(resource, user.role) || action.length > 1) notFound();
  if (resource === "security") {
    if (action.length) notFound();
    return <SecurityForm />;
  }
  if (resource === "slides") redirect("/admin/posts");
  const input = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["q", "type", "status", "trash"])
    if (typeof input[key] === "string" && input[key].length <= 150)
      query.set(key, input[key]);
  query.set(
    "page",
    String(Math.min(10000, Math.max(1, Number(input.page) || 1))),
  );
  query.set("per_page", "15");
  if (resource === "settings") {
    if (action.length) notFound();
    const [settings, media] = await Promise.all([
      readAdmin<Record<string, Value>>("/api/v1/admin/settings"),
      all("media"),
    ]);
    return <SettingsForm initial={settings.data} media={media} />;
  }
  if (resource === "media") {
    if (action.length) notFound();
    const result = await readAdmin<Entity[]>("/api/v1/admin/media?" + query);
    return (
      <MediaLibrary
        items={result.data}
        pagination={result.pagination}
        query={query.toString()}
      />
    );
  }
  const config = resources[resource];
  if (!config) notFound();
  if (!action.length) {
    const result = await readAdmin<Entity[]>(
      "/api/v1/admin/" + resource + "?" + query,
    );
    return (
      <AdminTable
        resource={resource}
        items={result.data}
        pagination={result.pagination}
        query={query.toString()}
        user={user}
      />
    );
  }
  const id = action[0];
  if (
    (id === "new" && (config.readOnly || config.noCreate)) ||
    (id !== "new" && !/^[1-9]\d*$/.test(id)) ||
    config.readOnly
  )
    notFound();
  const initial =
    id === "new"
      ? null
      : (await readAdmin<Entity>("/api/v1/admin/" + resource + "/" + id)).data;
  const sources = new Set(
    config.fields.flatMap((field) =>
      field.type === "media" ? ["media"] : field.source ? [field.source] : [],
    ),
  );
  if (resource === "albums") sources.add("media");
  const references: Record<string, Entity[]> = Object.fromEntries(
    await Promise.all(
      Array.from(sources).map(async (source) => [
        source,
        await all(source, user.role !== "editor" || source === "media"),
      ]),
    ),
  );
  if (resource === "pages") {
    return (
      <PageBuilder
        key={resource + id}
        initial={initial}
        media={references.media || []}
        saved={input.saved === "1"}
      />
    );
  }
  const selectedPage =
    resource === "menu-items" &&
    id === "new" &&
    typeof input.page_id === "string" &&
    /^[1-9]\d*$/.test(input.page_id)
      ? references.pages?.find((page) => String(page.id) === input.page_id)
      : undefined;
  const revisions =
    resource === "posts" && initial
      ? (
          await readAdmin<Entity[]>(
            "/api/v1/admin/posts/" + initial.id + "/revisions",
          )
        ).data
      : [];
  return (
    <>
      <ResourceForm
        key={resource + id}
        resource={resource}
        initial={initial}
        references={references}
        user={user}
        defaults={
          id === "new" &&
          resource === "posts" &&
          typeof input.type === "string" &&
          [
            "news",
            "article",
            "announcement",
            "resolution",
            "training",
            "welfare",
            "condolence",
            "group_event",
          ].includes(input.type)
            ? { type: input.type }
            : selectedPage
              ? {
                  page_id: selectedPage.id,
                  title: title(selectedPage),
                  url: entityPath("pages", selectedPage),
                }
              : {}
        }
      />
      {revisions.length > 0 && (
        <section className="admin-panel">
          <h2>تاریخچه ویرایش مطلب</h2>
          {revisions.map((revision) => (
            <details className="revision" key={revision.id}>
              <summary>
                {formatAdminDate(revision.created_at)} · ویرایشگر{" "}
                {text(revision.editor_id)}
              </summary>
              <RichContent
                html={text((revision.snapshot as Record<string, Value>)?.body)}
              />
            </details>
          ))}
        </section>
      )}
    </>
  );
}

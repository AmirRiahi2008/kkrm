import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { currentUser, serverApi } from "@/lib/api-server";
import { canAccess } from "@/lib/admin-resources";
import { ApiError } from "@/lib/errors";
import { entityPath } from "@/lib/shared";
import type { Entity } from "@/lib/types";
import "@/app/page-builder.css";

export const metadata: Metadata = {
  title: "پیش‌نمایش صفحه",
  robots: { index: false, follow: false },
};

export default async function PagePreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!canAccess("pages", user.role)) notFound();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) notFound();
  let item: Entity;
  try {
    item = (await serverApi<Entity>("/api/v1/admin/pages/" + id, true)).data;
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status))
      notFound();
    throw error;
  }
  const published = item.is_public === true;
  return (
    <>
      <section className="cms-preview-toolbar">
        <div>
          <strong>پیش‌نمایش نسخه ذخیره‌شده</strong>
          <p>این صفحه فقط برای مدیر و روابط عمومی قابل مشاهده است.</p>
        </div>
        <div>
          <Link
            href={"/admin/pages/" + id}
            prefetch={false}
            className="secondary-button"
          >
            ادامه ویرایش
          </Link>
          {published && (
            <Link
              href={entityPath("pages", item)}
              prefetch={false}
              className="primary-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              مشاهده در سایت
            </Link>
          )}
        </div>
      </section>
      <CmsPage item={item} preview />
    </>
  );
}

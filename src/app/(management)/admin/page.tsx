import Link from "next/link";
import { serverApi, currentUser } from "@/lib/api-server";
import { resources } from "@/lib/admin-resources";
import { faNumber, statusLabels } from "@/lib/shared";

export default async function Dashboard() {
  const user = await currentUser();
  const { data } = await serverApi<{
    posts: Record<string, number>;
    modules: Record<string, number>;
    new_messages: number | null;
  }>("/api/v1/admin/dashboard", true);
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>نمای کلی</h1>
          <p>{user.name}، آخرین وضعیت محتوای کانون را اینجا ببینید.</p>
        </div>
        <Link
          prefetch={false}
          href="/admin/posts/new"
          className="primary-button"
        >
          افزودن مطلب
        </Link>
      </div>
      <div className="stats-grid">
        {Object.entries(data.posts).map(([key, count]) => (
          <Link
            prefetch={false}
            className="stat-card"
            key={key}
            href={"/admin/posts?status=" + key}
          >
            <span>{statusLabels[key]}</span>
            <strong>{faNumber(count)}</strong>
            <span>مطالب</span>
          </Link>
        ))}
      </div>
      {data.new_messages !== null && (
        <div className="dashboard-message">
          <p>{faNumber(data.new_messages)} پیام جدید از بازدیدکنندگان</p>
          <Link prefetch={false} href="/admin/contact-messages">
            مشاهده پیام‌ها ←
          </Link>
        </div>
      )}
      <h2 className="admin-section-heading">مدیریت بخش‌های سایت</h2>
      <div className="module-grid">
        {Object.entries(data.modules).map(([key, count]) => (
          <Link
            prefetch={false}
            key={key}
            className="module-card"
            href={"/admin/" + key}
          >
            <strong>{resources[key]?.label || key}</strong>
            <span>{faNumber(count)} مورد</span>
          </Link>
        ))}
      </div>
    </>
  );
}

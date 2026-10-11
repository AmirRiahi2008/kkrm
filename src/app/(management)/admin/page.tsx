import { canAccess, resources } from "@/lib/admin-resources";
import { adminWeekday, formatAdminDate } from "@/lib/admin-date";
import { currentUser, serverApi } from "@/lib/api-server";
import { faNumber, statusLabels } from "@/lib/shared";
import {
  Archive,
  ArrowUpLeft,
  CalendarDays,
  Clock3,
  FileCheck2,
  FileText,
  Gavel,
  ImagePlus,
  Mail,
  Megaphone,
  Newspaper,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  posts: Record<string, number>;
  modules: Record<string, number>;
  new_messages: number | null;
  recent_posts: {
    id: number;
    title: string;
    status: string;
    type: string;
    updated_at: string;
  }[];
  activity: { date: string; count: number }[];
}
export default async function Dashboard() {
  const user = await currentUser();
  const { data } = await serverApi<DashboardData>(
    "/api/v1/admin/dashboard",
    true,
  );
  const actions = [
    {
      label: "ثبت خبر",
      hint: "خبر تازه کانون",
      href: "/admin/posts/new?type=news",
      resource: "posts",
      icon: Newspaper,
      tone: "blue",
    },
    {
      label: "اطلاعیه جدید",
      hint: "اطلاع‌رسانی فوری",
      href: "/admin/posts/new?type=announcement",
      resource: "posts",
      icon: Megaphone,
      tone: "amber",
    },
    {
      label: "ثبت مصوبه",
      hint: "تصمیم‌ها و مصوبات",
      href: "/admin/posts/new?type=resolution",
      resource: "posts",
      icon: Gavel,
      tone: "purple",
    },
    {
      label: "مقاله جدید",
      hint: "دانش و تجربه",
      href: "/admin/posts/new?type=article",
      resource: "posts",
      icon: FileText,
      tone: "teal",
    },
    {
      label: "آلبوم تصاویر",
      hint: "روایت تصویری کانون",
      href: "/admin/albums/new",
      resource: "albums",
      icon: ImagePlus,
      tone: "rose",
    },
    {
      label: "قانون و سند",
      hint: "اسناد و آیین‌نامه‌ها",
      href: "/admin/documents/new",
      resource: "documents",
      icon: FileCheck2,
      tone: "green",
    },
    {
      label: "ساخت صفحه جدید",
      hint: "محتوا و نشانی دلخواه",
      href: "/admin/pages/new",
      resource: "pages",
      icon: Plus,
      tone: "teal",
    },
  ].filter((item) => canAccess(item.resource, user.role));
  const statIcons = {
    draft: Clock3,
    review: FileCheck2,
    published: Send,
    archived: Archive,
  };
  const maxActivity = Math.max(
    1,
    ...(data.activity || []).map((item) => item.count),
  );
  return (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-eyebrow">
            <Sparkles size={16} />
            میز کار روابط عمومی
          </span>
          <h1>{user.name}، خوش آمدید</h1>
          <p>
            از همین‌جا محتوا بسازید، مطالب را بررسی کنید و ارتباط کانون را
            مدیریت کنید.
          </p>
          <span className="dashboard-date">
            <CalendarDays size={15} />
            {formatAdminDate(new Date().toISOString(), { weekday: true })}
          </span>
        </div>
        <Link
          prefetch={false}
          href="/admin/posts/new?type=news"
          className="dashboard-primary-action"
        >
          <Plus size={22} />
          ثبت خبر جدید
          <ArrowUpLeft size={20} />
        </Link>
      </section>
      <div className="dashboard-section-heading">
        <div>
          <h2>امروز چه کاری انجام می‌دهید؟</h2>
          <p>ابزارهای پرکاربرد، بدون جستجو در منو</p>
        </div>
      </div>
      <div className="dashboard-actions">
        {actions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={"quick-action tone-" + item.tone}
          >
            <span className="quick-action-icon">
              <item.icon size={23} />
            </span>
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
            <ArrowUpLeft size={16} />
          </Link>
        ))}
      </div>
      <div className="stats-grid dashboard-stats">
        {Object.entries(data.posts).map(([key, count]) => {
          const Icon = statIcons[key as keyof typeof statIcons] || FileText;
          return (
            <Link
              prefetch={false}
              className={"stat-card status-" + key}
              key={key}
              href={"/admin/posts?status=" + key}
            >
              <span className="stat-heading">
                <Icon size={18} />
                {statusLabels[key]}
              </span>
              <strong>{faNumber(count)}</strong>
              <span>
                مشاهده مطالب <ArrowUpLeft size={14} />
              </span>
            </Link>
          );
        })}
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <h2>نیازمند توجه شما</h2>
            <span className="soft-badge">پیگیری امروز</span>
          </div>
          <div className="attention-list">
            <Link href="/admin/posts?status=review" prefetch={false}>
              <span className="attention-icon">
                <FileCheck2 />
              </span>
              <div>
                <strong>مطالب در انتظار بررسی</strong>
                <p>بررسی و آماده‌سازی برای انتشار</p>
              </div>
              <b>{faNumber(data.posts.review || 0)}</b>
              <ArrowUpLeft size={18} />
            </Link>
            <Link href="/admin/posts?status=draft" prefetch={false}>
              <span className="attention-icon">
                <Clock3 />
              </span>
              <div>
                <strong>پیش‌نویس‌های ناتمام</strong>
                <p>ادامه نگارش مطالب ذخیره‌شده</p>
              </div>
              <b>{faNumber(data.posts.draft || 0)}</b>
              <ArrowUpLeft size={18} />
            </Link>
            {data.new_messages !== null && (
              <Link href="/admin/contact-messages" prefetch={false}>
                <span className="attention-icon">
                  <Mail />
                </span>
                <div>
                  <strong>پیام‌های جدید سایت</strong>
                  <p>رسیدگی به ارتباط بازدیدکنندگان</p>
                </div>
                <b>{faNumber(data.new_messages)}</b>
                <ArrowUpLeft size={18} />
              </Link>
            )}
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <h2>فعالیت هفت روز اخیر</h2>
            <span className="quiet">ثبت مطلب</span>
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={(data.activity || [])
              .map(
                (item) =>
                  formatAdminDate(item.date, { withTime: false }) +
                  ": " +
                  faNumber(item.count) +
                  " مطلب",
              )
              .join("، ")}
          >
            {(data.activity || []).map((item) => (
              <div key={item.date} className="activity-column">
                <span>{faNumber(item.count)}</span>
                <div className="activity-bar-track">
                  <i
                    style={{
                      height:
                        Math.max(3, (item.count / maxActivity) * 100) + "%",
                    }}
                  />
                </div>
                <time>{adminWeekday(item.date)}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="dashboard-panel">
        <div className="dashboard-section-heading">
          <div>
            <h2>آخرین مطالب شما</h2>
            <p>ادامه ویرایش از همان‌جایی که متوقف شدید</p>
          </div>
          <Link href="/admin/posts" prefetch={false}>
            همه مطالب <ArrowUpLeft size={16} />
          </Link>
        </div>
        <div className="recent-posts">
          {(data.recent_posts || []).length ? (
            data.recent_posts.map((item) => (
              <Link
                href={"/admin/posts/" + item.id}
                key={item.id}
                prefetch={false}
              >
                <span className="recent-post-icon">
                  <FileText size={19} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <time>آخرین تغییر: {formatAdminDate(item.updated_at)}</time>
                </div>
                <span className={"status-badge status-" + item.status}>
                  {statusLabels[item.status]}
                </span>
                <ArrowUpLeft size={18} />
              </Link>
            ))
          ) : (
            <div className="dashboard-empty">
              <Newspaper size={30} />
              <p>
                هنوز مطلبی ثبت نشده است؛ اولین خبر را از دکمه بالای صفحه بسازید.
              </p>
            </div>
          )}
        </div>
      </section>
      <details className="dashboard-module-details">
        <summary>
          تمام بخش‌های مدیریتی
          <span>{faNumber(Object.keys(data.modules).length)} بخش</span>
        </summary>
        <div className="module-grid">
          {Object.entries(data.modules)
            .filter(([key]) => canAccess(key, user.role))
            .map(([key, count]) => (
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
      </details>
    </>
  );
}

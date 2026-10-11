import { AdminShell } from "@/components/admin-shell";
import type { NotificationData } from "@/components/notification-center";
import { currentUser, serverApi } from "@/lib/api-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "داشبورد روابط عمومی",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const { data } = await serverApi<NotificationData>(
    "/api/v1/admin/notifications",
    true,
  );
  return (
    <AdminShell user={user} notifications={data}>
      {children}
    </AdminShell>
  );
}

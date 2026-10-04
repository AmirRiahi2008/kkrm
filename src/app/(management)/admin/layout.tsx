import { currentUser } from "@/lib/api-server";
import { AdminShell } from "@/components/admin-shell";
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
  return <AdminShell user={user}>{children}</AdminShell>;
}

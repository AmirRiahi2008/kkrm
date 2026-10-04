import { redirect } from "next/navigation";
import type { SearchParams } from "@/lib/types";

export const metadata = { robots: { index: false, follow: false } };
export default async function LegacyPasswordReset({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["email", "token"])
    if (typeof params[key] === "string") query.set(key, params[key]);
  redirect("/admin/reset-password?" + query);
}

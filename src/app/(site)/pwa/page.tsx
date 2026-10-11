import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";

export default async function PwaPage() {
  redirect(localePath("/download#pwa", await getLocale()));
}

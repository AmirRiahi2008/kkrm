import { getLocale } from "@/lib/i18n-server";
import { localePath } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function FeesPage() {
  redirect(localePath("/tariffs/calculator", await getLocale()));
}

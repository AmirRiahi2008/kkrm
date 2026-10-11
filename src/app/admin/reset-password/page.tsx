import { AuthForm } from "@/components/auth-form";
import type { SearchParams } from "@/lib/types";
export const metadata = {
  title: "تعیین رمز جدید",
  robots: { index: false, follow: false },
};
export default async function Reset({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="reset-password"
      email={typeof params.email === "string" ? params.email : ""}
      token={typeof params.token === "string" ? params.token : ""}
    />
  );
}

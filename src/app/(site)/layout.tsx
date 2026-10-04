import { serverApi } from "@/lib/api-server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { date } from "@/lib/shared";
import type { Menu, SiteSettings } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await serverApi<SiteSettings>("/api/v1/settings");
  return {
    title: {
      default: data.site_name || "کانون کارشناسان رسمی دادگستری مازندران",
      template: "%s | " + (data.site_name || "کانون کارشناسان مازندران"),
    },
    description: data.site_description,
   icons: {
    icon: "/assets/logo_kanoon.png",
},
  };
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navigation, settings] = await Promise.all([
    serverApi<Record<string, Menu[]>>("/api/v1/navigation"),
    serverApi<SiteSettings>("/api/v1/settings"),
  ]);
  return (
    <>
      <SiteHeader
        menus={navigation.data.header || []}
        mobileMenus={navigation.data.mobile || []}
        settings={settings.data}
        today={date(new Date().toISOString(), true)}
      />
      <main id="main">{children}</main>
      <SiteFooter
        settings={settings.data}
        links={navigation.data.footer || []}
      />
    </>
  );
}
import type { Metadata } from "next";

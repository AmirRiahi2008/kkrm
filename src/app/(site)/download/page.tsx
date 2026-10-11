import type { Metadata } from "next";
import { DownloadApp } from "@/components/download-app";
import { directAppDownloadUrl } from "@/lib/app-download";
import { getLocale } from "@/lib/i18n-server";
import "@/app/app-download.css";

export async function generateMetadata(): Promise<Metadata> {
  const english = (await getLocale()) === "en";
  return {
    title: english ? "Download and install" : "دانلود و نصب اپلیکیشن کانون",
    description: english
      ? "Download the council app or install the web version on your device."
      : "دانلود مستقیم اپلیکیشن کانون و نصب نسخه وب روی اندروید، آیفون و رایانه",
  };
}

export default function DownloadPage() {
  return <DownloadApp directUrl={directAppDownloadUrl()} />;
}

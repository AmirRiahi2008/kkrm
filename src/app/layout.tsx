import type { Metadata, Viewport } from "next";
import "./original.css";
import "./globals.css";
import "./table-styles.css";import "./board-contact.css";
import "./loader.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "کانون کارشناسان رسمی دادگستری مازندران",
    template: "%s | کانون کارشناسان مازندران",
  },
  description:
    "اخبار، اطلاعیه‌ها، مصوبات و خدمات کانون کارشناسان رسمی دادگستری مازندران",
  icons: { icon: "/assets/fig-44.png" },
};
export const viewport: Viewport = { themeColor: "#00477a" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
<body>

  {children}
</body>
    </html>
  );
}

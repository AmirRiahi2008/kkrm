"use client";

import { localePath } from "@/lib/i18n";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./locale-provider";

export default function LocalizedLink({
  href,
  ...props
}: ComponentProps<typeof Link>) {
  const { locale } = useLocale();
  return (
    <Link
      {...props}
      href={typeof href === "string" ? localePath(href, locale) : href}
    />
  );
}

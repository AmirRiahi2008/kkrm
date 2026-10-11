"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { startLoading } from "./loading-store";

export function useAppRouter() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!pending) return;
    return startLoading();
  }, [pending]);

  return useMemo(
    () => ({
      ...router,
      push: (...args: Parameters<typeof router.push>) =>
        startTransition(() => router.push(...args)),
      replace: (...args: Parameters<typeof router.replace>) =>
        startTransition(() => router.replace(...args)),
      refresh: () => startTransition(() => router.refresh()),
      back: () => startTransition(() => router.back()),
      forward: () => startTransition(() => router.forward()),
    }),
    [router],
  );
}

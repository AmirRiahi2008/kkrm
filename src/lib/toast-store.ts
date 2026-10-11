"use client";

export interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}
let snapshot: Toast[] = [];
let nextId = 0;
const subscribers = new Set<() => void>();
const empty: Toast[] = [];
function publish() {
  for (const callback of subscribers) callback();
}
export function dismissToast(id: number) {
  snapshot = snapshot.filter((toast) => toast.id !== id);
  publish();
}
export function notify(message: string, kind: Toast["kind"] = "success") {
  const id = ++nextId;
  snapshot = [...snapshot.slice(-3), { id, message, kind }];
  publish();
  window.setTimeout(() => dismissToast(id), kind === "error" ? 8000 : 5000);
}
export function subscribeToasts(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
export function getToasts() {
  return snapshot;
}
export function getServerToasts() {
  return empty;
}

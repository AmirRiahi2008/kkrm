"use client";

const operations = new Set<symbol>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeLoading(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLoadingCount() {
  return operations.size;
}

export function getServerLoadingCount() {
  return 0;
}

export function resetLoading() {
  if (!operations.size) return;
  operations.clear();
  notify();
}

export function startLoading() {
  const operation = Symbol();
  operations.add(operation);
  notify();

  return () => {
    if (operations.delete(operation)) notify();
  };
}

export async function withLoading<T>(action: () => Promise<T>): Promise<T> {
  const stop = startLoading();
  try {
    return await action();
  } finally {
    stop();
  }
}

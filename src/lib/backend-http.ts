import "server-only";
import { Agent } from "undici";

const dispatcher = new Agent({
  connections: 6,
  pipelining: 1,
  connect: { timeout: 20000 },
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 500,
  headersTimeout: 45000,
  bodyTimeout: 45000,
});

const retryableCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_SOCKET",
]);

export function backendFault(error: unknown): {
  code: string;
  timeout: boolean;
  message: string;
} {
  const pending: unknown[] = [error];
  const visited = new Set<unknown>();
  let code = "BACKEND_FETCH_FAILED";
  let timeout = false;

  while (pending.length) {
    const current = pending.shift();
    if (!current || typeof current !== "object" || visited.has(current))
      continue;
    visited.add(current);
    const detail = current as {
      code?: unknown;
      name?: unknown;
      cause?: unknown;
      errors?: unknown;
    };
    if (
      typeof detail.code === "string" &&
      /^[A-Z][A-Z0-9_]{1,64}$/.test(detail.code)
    ) {
      code = detail.code;
    }
    if (detail.name === "TimeoutError" || detail.name === "AbortError") {
      timeout = true;
    }
    if (detail.cause) pending.push(detail.cause);
    if (Array.isArray(detail.errors)) pending.push(...detail.errors);
  }

  timeout ||= [
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_BODY_TIMEOUT",
  ].includes(code);

  let message = "ارتباط با سرور لاراول برقرار نشد.";
  if (timeout) message = "زمان انتظار برای اتصال یا پاسخ سرور لاراول تمام شد.";
  else if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) {
    message = "نشانی سرور لاراول در دسترس نیست.";
  } else if (code === "ECONNREFUSED") {
    message = "سرور لاراول اتصال را نپذیرفت.";
  } else if (/CERT|TLS/.test(code)) {
    message = "برقراری اتصال امن با سرور لاراول انجام نشد.";
  }

  return { code, timeout, message };
}

export async function backendFetch(
  url: string | URL,
  options: RequestInit = {},
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const readOnly = ["GET", "HEAD", "OPTIONS"].includes(method);
  const signals = [AbortSignal.timeout(45000)];
  if (options.signal) signals.push(options.signal);
  const signal = AbortSignal.any(signals);
  const attempts = readOnly ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const init: RequestInit & { dispatcher: Agent } = {
        ...options,
        method,
        dispatcher,
        signal,
        cache: "no-store",
        redirect: "manual",
      };
      const response = await fetch(url, init);
      if (
        readOnly &&
        attempt + 1 < attempts &&
        [502, 503, 504].includes(response.status) &&
        !signal.aborted
      ) {
        await response.body?.cancel();
        continue;
      }
      return response;
    } catch (error) {
      if (
        attempt + 1 >= attempts ||
        signal.aborted ||
        !retryableCodes.has(backendFault(error).code)
      ) {
        throw error;
      }
    }
  }

  throw new Error("Backend request did not complete");
}

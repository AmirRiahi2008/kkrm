import "server-only";
import { Agent } from "undici";

const connectionOptions = {
  connections: 12,
  pipelining: 1,
  connect: { timeout: 15000 },
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 500,
  headersTimeout: 45000,
  bodyTimeout: 45000,
};

const dispatcher = new Agent(connectionOptions);
const mediaDispatcher = new Agent({ ...connectionOptions, connections: 12 });

type BackendOptions = {
  timeoutMs?: number;
  media?: boolean;
};

const retryableCodes = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_RES_CONTENT_LENGTH_MISMATCH",
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
  { timeoutMs = 45000, media = false }: BackendOptions = {},
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const readOnly = ["GET", "HEAD", "OPTIONS"].includes(method);
  const signals = [AbortSignal.timeout(timeoutMs)];
  if (options.signal) signals.push(options.signal);
  const signal = AbortSignal.any(signals);
  const attempts = readOnly ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const init: RequestInit & { dispatcher: Agent } = {
        ...options,
        method,
        dispatcher: media ? mediaDispatcher : dispatcher,
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
      const contentType = response.headers.get("content-type") || "";
      if (
        method === "GET" &&
        response.ok &&
        ![204, 205].includes(response.status) &&
        (/^application\/json(?:;|$)/i.test(contentType) ||
          (media &&
            /^image\/(?:jpeg|png|webp|gif|avif)(?:;|$)/i.test(contentType)))
      ) {
        const body = await response.arrayBuffer();
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
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

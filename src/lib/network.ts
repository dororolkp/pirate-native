/** Read backoff only: robot mutations must never be automatically replayed. */
export function pollingDelay(failures: number) {
  return Math.min(30_000, 2000 * 2 ** Math.min(4, Math.max(0, failures)));
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly kind: "http" | "timeout" | "canceled" | "network" | "contract",
    readonly status?: number,
    readonly retryAfterMs = 0,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function retryAfterDelay(value: string | null, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(value) - now;
  return Number.isFinite(delay) ? Math.max(0, Math.min(60_000, delay)) : 0;
}

/** One bounded request per call; cancellation and retries belong to the caller. */
export class JsonApiClient {
  private controllers = new Set<AbortController>();
  constructor(
    private baseUrl: string,
    private timeoutMs = 8000,
  ) {}

  abortAll() {
    this.controllers.forEach((controller) => controller.abort());
  }

  async request(
    path: string,
    options: RequestInit = {},
    allowEmpty = false,
  ): Promise<unknown> {
    let base: URL;
    try {
      base = new URL(this.baseUrl);
    } catch {
      throw new ApiRequestError("API URL is invalid.", "contract");
    }
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new ApiRequestError(
        "API URL must be HTTP(S) without credentials, query strings or fragments.",
        "contract",
      );
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new ApiRequestError("Invalid API resource path.", "contract");
    const controller = new AbortController();
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");
    if (options.body && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    this.controllers.add(controller);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      const response = await fetch(
        `${this.baseUrl.replace(/\/+$/, "")}${path}`,
        {
          ...options,
          signal: controller.signal,
          headers,
        },
      );
      const text = await response.text();
      let body: unknown = null;
      let malformed = false;
      try {
        if (text.trim()) body = JSON.parse(text);
      } catch {
        malformed = true;
      }
      if (!response.ok) {
        const detail =
          body && typeof body === "object" && "detail" in body
            ? body.detail
            : null;
        throw new ApiRequestError(
          typeof detail === "string"
            ? detail.slice(0, 300)
            : `API request failed (${response.status}).`,
          "http",
          response.status,
          retryAfterDelay(response.headers.get("Retry-After")),
        );
      }
      if (malformed || (response.status !== 204 && !text.trim() && !allowEmpty))
        throw new ApiRequestError(
          "API response is not valid JSON.",
          "contract",
        );
      return body;
    } catch (error) {
      if (timedOut)
        throw new ApiRequestError(
          `Network request timed out after ${this.timeoutMs / 1000} seconds.`,
          "timeout",
        );
      if (controller.signal.aborted)
        throw new ApiRequestError("API request canceled.", "canceled");
      if (error instanceof ApiRequestError) throw error;
      throw new ApiRequestError(
        error instanceof Error ? error.message : "Network unavailable.",
        "network",
      );
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(controller);
    }
  }
}

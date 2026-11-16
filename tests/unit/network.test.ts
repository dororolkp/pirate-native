import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiRequestError,
  JsonApiClient,
  pollingDelay,
  retryAfterDelay,
} from "../../src/lib/network";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("Network policies", () => {
  it("backs off failed reads and caps the delay", () => {
    expect([0, 1, 2, 3, 4, 100].map(pollingDelay)).toEqual([
      2000, 4000, 8000, 16000, 30000, 30000,
    ]);
  });
  it("bounds numeric and date Retry-After headers", () => {
    expect(retryAfterDelay("5")).toBe(5000);
    expect(retryAfterDelay("999")).toBe(60_000);
    expect(retryAfterDelay("-1")).toBe(0);
    expect(retryAfterDelay("invalid")).toBe(0);
    expect(retryAfterDelay(new Date(5000).toUTCString(), 2000)).toBe(3000);
  });
  it("preserves request headers and makes only one mutation attempt", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"task_id":"t1"}'));
    vi.stubGlobal("fetch", fetcher);
    const client = new JsonApiClient("https://robot.example/");
    await client.request("/api/v1/tasks", {
      method: "POST",
      body: "{}",
      headers: new Headers({ "X-Request-ID": "local-request" }),
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://robot.example/api/v1/tasks");
    expect(options.headers.get("Accept")).toBe("application/json");
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.headers.get("X-Request-ID")).toBe("local-request");
  });
  it.each([
    "ftp://robot.example",
    "https://user:secret@robot.example",
    "https://robot.example?token=secret",
    "not a URL",
  ])("rejects unsafe base %s before fetching", async (base) => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      new JsonApiClient(base).request("/robots"),
    ).rejects.toBeInstanceOf(ApiRequestError);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects protocol-relative resource paths", async () => {
    await expect(
      new JsonApiClient("https://robot.example").request("//other.example"),
    ).rejects.toThrow("resource");
  });
  it("exposes HTTP classification without automatic retry", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('{"detail":"Gateway warming up"}', {
        status: 503,
        headers: { "Retry-After": "10" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      new JsonApiClient("https://robot.example").request("/robots"),
    ).rejects.toMatchObject({
      kind: "http",
      status: 503,
      retryAfterMs: 10_000,
      message: "Gateway warming up",
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("rejects malformed JSON and accepts a no-content cancellation reply", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("broken"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const client = new JsonApiClient("https://robot.example");
    await expect(client.request("/robots")).rejects.toMatchObject({
      kind: "contract",
    });
    await expect(
      client.request("/cancel", { method: "POST" }),
    ).resolves.toBeNull();
    await expect(
      client.request("/cancel", { method: "POST" }, true),
    ).resolves.toBeNull();
  });
  function stalledFetch() {
    const fetcher = vi.fn().mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    return fetcher;
  }
  it("aborts timed-out requests and cleans its timer", async () => {
    vi.useFakeTimers();
    const fetcher = stalledFetch();
    const failure = expect(
      new JsonApiClient("https://robot.example").request("/robots"),
    ).rejects.toMatchObject({ kind: "timeout" });
    await vi.advanceTimersByTimeAsync(8000);
    await failure;
    expect(fetcher).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels requests separately from timeouts", async () => {
    vi.useFakeTimers();
    stalledFetch();
    const client = new JsonApiClient("https://robot.example");
    const failure = expect(client.request("/robots")).rejects.toMatchObject({
      kind: "canceled",
    });
    client.abortAll();
    await failure;
    expect(vi.getTimerCount()).toBe(0);
  });
});

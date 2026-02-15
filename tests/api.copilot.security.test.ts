import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const handleRequestMock = vi.fn<() => Promise<Response>>();

vi.mock("@copilotkit/runtime", () => {
  return {
    CopilotRuntime: class {},
    OpenAIAdapter: class {
      constructor() {}
    },
    copilotRuntimeNextJSAppRouterEndpoint: vi.fn(() => ({
      handleRequest: handleRequestMock,
    })),
  };
});

vi.mock("openai", () => {
  return {
    default: class {
      constructor() {}
    },
  };
});

import { POST, __testUtils } from "../app/api/copilot/route";

function makeRequest(body: unknown, headers?: HeadersInit): NextRequest {
  return new NextRequest("http://localhost:3000/api/copilot", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("API: /api/copilot security", () => {
  beforeEach(() => {
    process.env.DIVIORA_CONSOLE_AUTH_TOKEN = "secret-token";
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.DIVIORA_COPILOT_TIMEOUT_MS;
    handleRequestMock.mockReset();
    handleRequestMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    __testUtils.resetRateLimit();
  });

  it("returns 401 when auth header is missing", async () => {
    const res = await POST(makeRequest({ message: "hello" }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    expect(handleRequestMock).not.toHaveBeenCalled();
  });

  it("returns 401 when auth header is wrong", async () => {
    const res = await POST(
      makeRequest(
        { message: "hello" },
        {
          "X-DIVIORA-AUTH": "wrong-token",
        }
      )
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    expect(handleRequestMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const headers = {
      "X-DIVIORA-AUTH": "secret-token",
      "X-Forwarded-For": "10.0.0.1",
    };

    for (let i = 0; i < 30; i += 1) {
      const res = await POST(makeRequest({ message: `msg-${i}` }, headers));
      expect(res.status).toBe(200);
    }

    const blocked = await POST(makeRequest({ message: "msg-31" }, headers));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    await expect(blocked.json()).resolves.toEqual({ error: "rate_limited" });
    expect(handleRequestMock).toHaveBeenCalledTimes(30);
  });

  it("returns 413 for oversized message payload", async () => {
    const res = await POST(
      makeRequest(
        { message: "a".repeat(8001) },
        {
          "X-DIVIORA-AUTH": "secret-token",
        }
      )
    );
    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ error: "payload_too_large" });
    expect(handleRequestMock).not.toHaveBeenCalled();
  });

  it("returns 504 when upstream times out", async () => {
    process.env.DIVIORA_COPILOT_TIMEOUT_MS = "5";
    handleRequestMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ ok: true }), {
                  status: 200,
                })
              ),
            50
          );
        })
    );

    const res = await POST(
      makeRequest(
        { message: "timeout-test" },
        {
          "X-DIVIORA-AUTH": "secret-token",
        }
      )
    );

    expect(res.status).toBe(504);
    await expect(res.json()).resolves.toEqual({ error: "upstream_timeout" });
  });

  it("returns 200 on authorized happy path", async () => {
    const res = await POST(
      makeRequest(
        { message: "ok" },
        {
          "X-DIVIORA-AUTH": "secret-token",
          "X-Forwarded-For": "10.0.0.2",
        }
      )
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(handleRequestMock).toHaveBeenCalledTimes(1);
  });
});

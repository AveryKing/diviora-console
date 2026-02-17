import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";
import { createSlidingWindowRateLimiter } from "@/lib/ratelimit";
import packageJson from "@/package.json";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function readCopilotKitVersion(): string {
  const dependencies = packageJson.dependencies ?? {};
  if (typeof dependencies["@copilotkit/runtime"] === "string") {
    return dependencies["@copilotkit/runtime"];
  }
  return "unknown";
}

const isLocalDev = process.env.NODE_ENV === "development";
const RATE_LIMIT_COUNT = Number(process.env.DIVIORA_COPILOT_RATE_LIMIT_COUNT ?? (isLocalDev ? "1000" : "30"));
const RATE_LIMIT_WINDOW_MS = Number(process.env.DIVIORA_COPILOT_RATE_LIMIT_WINDOW_MS ?? (isLocalDev ? "60000" : String(10 * 60 * 1000)));
const MAX_MESSAGE_LENGTH = 8000;
const MAX_HISTORY_MESSAGES = 200;
const DEFAULT_UPSTREAM_TIMEOUT_MS = 20_000;

const limiter = createSlidingWindowRateLimiter(RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS);

type JsonRecord = Record<string, unknown>;

function jsonError(status: number, error: string, extraHeaders?: HeadersInit): Response {
  return new Response(
    JSON.stringify({ error }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(extraHeaders ?? {}),
      },
    }
  );
}

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const reqWithIp = req as NextRequest & { ip?: string };
  if (reqWithIp.ip) return reqWithIp.ip;
  return "unknown";
}

function shouldBypassRateLimit(clientKey: string): boolean {
  if (!isLocalDev) return false;
  return clientKey === "127.0.0.1" || clientKey === "::1" || clientKey === "localhost" || clientKey === "unknown";
}

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((part) => normalizeText(part))
      .join("");
  }
  if (value && typeof value === "object") {
    const obj = value as JsonRecord;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.value === "string") return obj.value;
  }
  return "";
}

type PayloadGuardResult = {
  ok: boolean;
  error?: string;
};

function validatePayload(payload: unknown): PayloadGuardResult {
  if (!payload || typeof payload !== "object") return { ok: true };
  const body = payload as JsonRecord;

  const message = normalizeText(body.message);
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "payload_too_large" };
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length > MAX_HISTORY_MESSAGES) {
    return { ok: false, error: "payload_too_large" };
  }

  for (const item of messages) {
    if (!item || typeof item !== "object") continue;
    const itemRecord = item as JsonRecord;
    const content = normalizeText(itemRecord.content ?? itemRecord.message ?? itemRecord.text);
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { ok: false, error: "payload_too_large" };
    }
  }

  return { ok: true };
}

function isSingleTransportInfoCall(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as JsonRecord;
  return record.method === "info";
}

function runtimeInfoResponse(): Response {
  return new Response(
    JSON.stringify({
      version: readCopilotKitVersion(),
      audioFileTranscriptionEnabled: false,
      agents: {
        default: {
          name: "default",
          className: "BuiltInAgent",
          description: "Default agent",
        },
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("upstream_timeout"));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export const POST = async (req: NextRequest) => {
  const expectedToken = process.env.DIVIORA_CONSOLE_AUTH_TOKEN;
  const providedToken = req.headers.get("x-diviora-auth");
  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return jsonError(401, "unauthorized");
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await req.clone().json();
  } catch {
    return jsonError(400, "invalid_json");
  }

  // CopilotKit2's "single" transport probes runtime info via POST { method: "info" } to runtimeUrl.
  // This must succeed without invoking an LLM.
  if (isSingleTransportInfoCall(parsedBody)) {
    return runtimeInfoResponse();
  }

  const clientKey = getClientKey(req);
  if (!shouldBypassRateLimit(clientKey)) {
    const rate = limiter.check(clientKey);
    if (!rate.allowed) {
      return jsonError(429, "rate_limited", {
        "Retry-After": String(rate.retryAfterSeconds),
      });
    }
  }

  const payloadCheck = validatePayload(parsedBody);
  if (!payloadCheck.ok) {
    return jsonError(413, payloadCheck.error ?? "payload_too_large");
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonError(500, "missing_openai_api_key");
  }

  const runtime = new CopilotRuntime();
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const serviceAdapter = new OpenAIAdapter({ 
    openai: openaiClient as unknown as NonNullable<ConstructorParameters<typeof OpenAIAdapter>[0]>['openai'],
    model: "gpt-4o-mini"
  });

  const handler = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

  const timeoutMs = Number(process.env.DIVIORA_COPILOT_TIMEOUT_MS ?? DEFAULT_UPSTREAM_TIMEOUT_MS);

  try {
    return await withTimeout(Promise.resolve(handler.handleRequest(req)), timeoutMs);
  } catch (error) {
    if (error instanceof Error && error.message === "upstream_timeout") {
      return jsonError(504, "upstream_timeout");
    }
    throw error;
  }
};

export const __testUtils = {
  resetRateLimit: () => limiter.reset(),
};

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Keep in sync with installed CopilotKit packages. Avoid importing from `@copilotkit/shared`
// here, since that dependency chain can break Vitest in this repo's test environment.
const COPILOTKIT_VERSION = "1.51.3";

function json(status: number, body: unknown, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders ?? {}),
    },
  });
}

async function handleInfo(req: NextRequest): Promise<Response> {
  const expectedToken = process.env.DIVIORA_CONSOLE_AUTH_TOKEN;
  const providedToken = req.headers.get("x-diviora-auth");
  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return json(401, { error: "unauthorized" });
  }

  // CopilotKit runtime sync expects this shape from `${runtimeUrl}/info`.
  // We expose a minimal RuntimeInfo payload so the client can register at least a "default" agent.
  return json(200, {
    version: COPILOTKIT_VERSION,
    audioFileTranscriptionEnabled: false,
    agents: {
      default: {
        name: "default",
        className: "BuiltInAgent",
        description: "Default agent",
      },
    },
  });
}

export const GET = async (req: NextRequest) => {
  return await handleInfo(req);
};

export const POST = async (req: NextRequest) => {
  return await handleInfo(req);
};

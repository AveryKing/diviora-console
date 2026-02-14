import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Copilot temporarily unavailable: Missing API Key" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openai = new OpenAI({
    apiKey,
  });

  const serviceAdapter = new OpenAIAdapter({ 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openai: openai as any,
    model: "gpt-5.2-chat-latest"
  });
  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  });

  return handleRequest(req);
};

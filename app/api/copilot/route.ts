import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = async (req: NextRequest) => {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const runtime = new CopilotRuntime();
  const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const serviceAdapter = new OpenAIAdapter({ 
    openai: openaiClient as unknown as NonNullable<ConstructorParameters<typeof OpenAIAdapter>[0]>['openai'],
    model: "gpt-4o-mini"
  });

  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilot",
  }).handleRequest(req);
};

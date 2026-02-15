'use client';

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { ReactNode } from "react";
import { CopilotContextHandler } from "./CopilotContextHandler";

interface CopilotProviderProps {
  children: ReactNode;
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  const authToken = process.env.NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN;
  const headers = authToken
    ? { "X-DIVIORA-AUTH": authToken }
    : undefined;

  return (
    <CopilotKit runtimeUrl="/api/copilot" headers={headers}>
      <CopilotContextHandler />
      {children}
    </CopilotKit>
  );
}

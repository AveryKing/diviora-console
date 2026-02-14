'use client';

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { ReactNode } from "react";
import { CopilotContextHandler } from "./CopilotContextHandler";
import { DivioraCopilotSidebar } from "./DivioraCopilotSidebar";

interface CopilotProviderProps {
  children: ReactNode;
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilot">
      <CopilotContextHandler />
      {children}
      <DivioraCopilotSidebar />
    </CopilotKit>
  );
}

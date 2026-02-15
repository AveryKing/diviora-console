import type { CopilotHttpError } from "./copilot_http_error";

export const COPILOT_HTTP_ERROR_EVENT = "diviora:copilot-http-error";

export type CopilotHttpErrorEventDetail = {
  error: CopilotHttpError;
};

export function emitCopilotHttpError(error: CopilotHttpError) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CopilotHttpErrorEventDetail>(COPILOT_HTTP_ERROR_EVENT, {
      detail: { error },
    })
  );
}


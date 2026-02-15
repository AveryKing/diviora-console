export type CopilotHttpStatus = 401 | 413 | 429 | 504;

export type CopilotHttpError = {
  status: CopilotHttpStatus;
  retryAfterSeconds?: number;
  rawMessage?: string;
};

export function isCopilotHttpStatus(status: number): status is CopilotHttpStatus {
  return status === 401 || status === 413 || status === 429 || status === 504;
}

export function formatCopilotHttpErrorMessage(
  error: CopilotHttpError,
  nowRetryAfterSeconds?: number
): string {
  switch (error.status) {
    case 401:
      return "Copilot not configured (missing token).";
    case 413:
      return "Message too long. Shorten it.";
    case 504:
      return "Copilot timed out. Retry.";
    case 429: {
      const seconds = nowRetryAfterSeconds ?? error.retryAfterSeconds ?? 60;
      return `Rate limited. Try again in ${Math.max(1, Math.floor(seconds))}s.`;
    }
  }
}

function parseStatusFromText(text: string): number | null {
  const match = text.match(/\bHTTP\s+(\d{3})\b/i);
  if (match?.[1]) {
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseRetryAfterFromText(text: string): number | undefined {
  // Best-effort: some errors might include "retry-after: 12"
  const match = text.match(/\bretry-after:\s*(\d+)\b/i);
  if (match?.[1]) return Number(match[1]);
  return undefined;
}

export function parseCopilotHttpErrorSync(reason: unknown): CopilotHttpError | null {
  if (!reason) return null;

  if (reason instanceof Error) {
    const status = parseStatusFromText(reason.message);
    if (status && isCopilotHttpStatus(status)) {
      return {
        status,
        retryAfterSeconds: parseRetryAfterFromText(reason.message),
        rawMessage: reason.message,
      };
    }
  }

  if (typeof reason === "string") {
    const status = parseStatusFromText(reason);
    if (status && isCopilotHttpStatus(status)) {
      return {
        status,
        retryAfterSeconds: parseRetryAfterFromText(reason),
        rawMessage: reason,
      };
    }
  }

  return null;
}

export async function parseCopilotHttpError(reason: unknown): Promise<CopilotHttpError | null> {
  const sync = parseCopilotHttpErrorSync(reason);
  if (sync) return sync;

  // Some libraries throw Response directly.
  if (typeof Response !== "undefined" && reason instanceof Response) {
    const status = reason.status;
    if (!isCopilotHttpStatus(status)) return null;
    const retryAfter = reason.headers.get("Retry-After");
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
    return {
      status,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
      rawMessage: `HTTP ${status}`,
    };
  }

  return null;
}


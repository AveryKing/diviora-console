'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { COPILOT_HTTP_ERROR_EVENT, CopilotHttpErrorEventDetail } from "@/lib/copilot_error_bus";
import { CopilotHttpError, parseCopilotHttpError } from "@/lib/copilot_http_error";
import { CopilotErrorBanner } from "./CopilotErrorBanner";

type CopilotErrorUxState = {
  error: CopilotHttpError;
  expiresAtMs?: number;
};

export function CopilotErrorUX() {
  const [state, setState] = useState<CopilotErrorUxState | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | undefined>(undefined);
  const intervalRef = useRef<number | null>(null);

  const dismiss = () => {
    setState(null);
    setRetryAfterSeconds(undefined);
  };

  const startRetryCountdown = (seconds: number) => {
    const expiresAtMs = Date.now() + seconds * 1000;
    setState((prev) => (prev ? { ...prev, expiresAtMs } : prev));
    setRetryAfterSeconds(seconds);

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setRetryAfterSeconds(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 250);
  };

  const currentError = state?.error ?? null;

  const effectiveRetryAfter = useMemo(() => {
    if (!currentError) return undefined;
    if (currentError.status !== 429) return undefined;
    return retryAfterSeconds ?? currentError.retryAfterSeconds;
  }, [currentError, retryAfterSeconds]);

  useEffect(() => {
    const onCustomError = (e: Event) => {
      const event = e as CustomEvent<CopilotHttpErrorEventDetail>;
      const error = event.detail?.error;
      if (!error) return;
      setState({ error });
      if (error.status === 429 && error.retryAfterSeconds) {
        startRetryCountdown(error.retryAfterSeconds);
      } else {
        setRetryAfterSeconds(undefined);
      }
    };

    const onUnhandled = (e: PromiseRejectionEvent) => {
      // Suppress known Copilot HTTP errors so they don't surface as unhandled rejections / overlays.
      void (async () => {
        const parsed = await parseCopilotHttpError(e.reason);
        if (!parsed) return;
        e.preventDefault();
        setState({ error: parsed });
        if (parsed.status === 429) {
          startRetryCountdown(parsed.retryAfterSeconds ?? 60);
        } else {
          setRetryAfterSeconds(undefined);
        }
      })();
    };

    const onError = (e: ErrorEvent) => {
      // Some frameworks surface async failures via window.onerror.
      void (async () => {
        const parsed = await parseCopilotHttpError(e.error ?? e.message);
        if (!parsed) return;
        e.preventDefault();
        setState({ error: parsed });
        if (parsed.status === 429) {
          startRetryCountdown(parsed.retryAfterSeconds ?? 60);
        } else {
          setRetryAfterSeconds(undefined);
        }
      })();
    };

    window.addEventListener(COPILOT_HTTP_ERROR_EVENT, onCustomError as EventListener);
    window.addEventListener("unhandledrejection", onUnhandled);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener(COPILOT_HTTP_ERROR_EVENT, onCustomError as EventListener);
      window.removeEventListener("unhandledrejection", onUnhandled);
      window.removeEventListener("error", onError);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, []);

  if (!currentError) return null;
  return (
    <CopilotErrorBanner
      error={currentError}
      retryAfterSeconds={effectiveRetryAfter}
      onDismiss={dismiss}
    />
  );
}


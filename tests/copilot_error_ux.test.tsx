import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { CopilotErrorUX } from "../app/components/copilot/CopilotErrorUX";
import { emitCopilotHttpError } from "../lib/copilot_error_bus";

describe("CopilotErrorUX", () => {
  it("shows 401 message", () => {
    render(<CopilotErrorUX />);
    act(() => emitCopilotHttpError({ status: 401 }));
    expect(screen.getByTestId("copilot-error-banner")).toHaveTextContent(
      "Copilot not configured (missing token)."
    );
  });

  it("shows 413 message", () => {
    render(<CopilotErrorUX />);
    act(() => emitCopilotHttpError({ status: 413 }));
    expect(screen.getByTestId("copilot-error-banner")).toHaveTextContent(
      "Message too long. Shorten it."
    );
  });

  it("shows 504 message", () => {
    render(<CopilotErrorUX />);
    act(() => emitCopilotHttpError({ status: 504 }));
    expect(screen.getByTestId("copilot-error-banner")).toHaveTextContent(
      "Copilot timed out. Retry."
    );
  });

  it("shows 429 message with countdown seconds", () => {
    vi.useFakeTimers();
    render(<CopilotErrorUX />);
    act(() => emitCopilotHttpError({ status: 429, retryAfterSeconds: 3 }));
    expect(screen.getByTestId("copilot-error-banner")).toHaveTextContent(
      "Rate limited. Try again in 3s."
    );

    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByTestId("copilot-error-banner")).toHaveTextContent(
      "Rate limited. Try again in 2s."
    );
    vi.useRealTimers();
  });
});


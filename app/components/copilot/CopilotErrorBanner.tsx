'use client';

import { CopilotHttpError, formatCopilotHttpErrorMessage } from "@/lib/copilot_http_error";

type CopilotErrorBannerProps = {
  error: CopilotHttpError;
  retryAfterSeconds?: number;
  onDismiss: () => void;
};

export function CopilotErrorBanner({ error, retryAfterSeconds, onDismiss }: CopilotErrorBannerProps) {
  return (
    <div
      data-testid="copilot-error-banner"
      className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-sm"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold uppercase tracking-wider text-[10px] text-amber-700">Copilot</div>
          <div className="mt-1 break-words">
            {formatCopilotHttpErrorMessage(error, retryAfterSeconds)}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md border border-amber-200 bg-white px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}


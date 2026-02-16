'use client';

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { ProposalRenderer } from "../ProposalRenderer";
import { ContextPanel } from "./ContextPanel";
import Link from "next/link";
import { Proposal } from "@/lib/types";

type HomeArtifactPanelProps = {
  tab: "artifact" | "context";
  onTabChange: (tab: "artifact" | "context") => void;
};

function getLatestProposal(proposals: Proposal[]): Proposal | null {
  if (proposals.length === 0) return null;
  return proposals.reduce((latest, candidate) => {
    const latestTs = Date.parse(latest.created_at);
    const candidateTs = Date.parse(candidate.created_at);

    if (Number.isNaN(candidateTs)) return latest;
    if (Number.isNaN(latestTs)) return candidate;
    return candidateTs > latestTs ? candidate : latest;
  });
}

export function HomeArtifactPanel({ tab, onTabChange }: HomeArtifactPanelProps) {
  const { state } = useStore();
  const latestProposal = getLatestProposal(state.proposals);

  const hasProposal = Boolean(latestProposal);

  const header = useMemo(() => {
    return (
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-testid="home-artifact-tab-artifact"
            onClick={() => onTabChange("artifact")}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
              tab === "artifact" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Artifact
          </button>
          <button
            type="button"
            data-testid="home-artifact-tab-context"
            onClick={() => onTabChange("context")}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
              tab === "context" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Context
          </button>
        </div>
      </div>
    );
  }, [onTabChange, tab]);

  return (
    <aside
      data-testid="home-right-panel"
      className="w-[420px] border-l border-gray-200 bg-gray-50 flex flex-col min-w-0"
    >
      {header}

      <div data-testid="home-context-panel" className="flex-1 min-h-0 overflow-y-auto p-3">
        {tab === "context" ? (
          <div className="h-full">
            <ContextPanel />
          </div>
        ) : hasProposal ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="mb-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Latest Proposal (In-Context)
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-400">
                  Sections render here.
                </div>
                <Link
                  href={`/artifacts/${latestProposal!.proposal_id}`}
                  data-testid="latest-proposal-link"
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Open full
                </Link>
              </div>
            </div>
            <ProposalRenderer proposal={latestProposal!} isLatest={false} density="dense" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-xs text-gray-500">
            No proposal yet. Submit a message to compile a proposal, then it will render here.
          </div>
        )}
      </div>
    </aside>
  );
}

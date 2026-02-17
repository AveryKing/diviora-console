'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { useStore } from '@/lib/store';
import { useSessionStore } from '@/lib/session_store';
import { CopilotContextHandler } from '../components/CopilotContextHandler';
import { CopilotErrorUX } from '../components/copilot/CopilotErrorUX';
import { buildAgentContextPacket, getLatestProjectSnapshot, getLatestProposal } from '@/lib/agent_context_packet';
import { ProposalRenderer } from '../components/ProposalRenderer';
import Link from 'next/link';
import { AgentPack } from '@/lib/types';
import { AgentPacksPanel } from '../components/agent/AgentPacksPanel';
import { ensurePackSections } from '@/lib/agent_pack_template';

type AgentTab = 'memory' | 'proposal' | 'approvals' | 'runs' | 'packs';

type ProposedAgentPackDraft = {
  kind: AgentPack['kind'];
  title: string;
  content_markdown: string;
  selected_goals?: string[];
  source_input: string;
};

export default function AgentPage() {
  const { state, updateSettings, addAgentPack, setAgentPackStatus } = useStore();
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const hasSessions = useSessionStore((s) => s.sessions.length > 0);
  const firstSessionId = useSessionStore((s) => s.sessions[0]?.session_id ?? null);
  const sessionActions = useSessionStore((s) => s.actions);
  const sessionsHydrated = useSessionStore((s) => s.hydrated);

  const authToken = process.env.NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN;
  const headers = authToken ? { 'X-DIVIORA-AUTH': authToken } : undefined;

  const [tab, setTab] = useState<AgentTab>('memory');
  const [proposedPackDraft, setProposedPackDraft] = useState<ProposedAgentPackDraft | null>(null);
  const viewMode = state.settings.agent_view_mode ?? 'split';

  useEffect(() => {
    if (!sessionsHydrated) return;
    if (!currentSessionId) {
      if (hasSessions) {
        if (firstSessionId) sessionActions.switchSession(firstSessionId);
      } else {
        sessionActions.createSession('Agent Session');
      }
    }
  }, [sessionsHydrated, currentSessionId, hasSessions, firstSessionId, sessionActions]);

  useEffect(() => {
    const onProposedPack = (event: Event) => {
      const customEvent = event as CustomEvent<ProposedAgentPackDraft>;
      if (!customEvent.detail) return;
      setTab('packs');
      setProposedPackDraft(customEvent.detail);
    };

    window.addEventListener('diviora:agent-pack-proposed', onProposedPack as EventListener);
    return () => window.removeEventListener('diviora:agent-pack-proposed', onProposedPack as EventListener);
  }, []);

  const contextPacket = useMemo(
    () =>
      buildAgentContextPacket({
        settings: state.settings,
        proposals: state.proposals,
        projectSnapshots: state.projectSnapshots,
      }),
    [state.settings, state.proposals, state.projectSnapshots]
  );

  const latestSnapshot = getLatestProjectSnapshot(state.projectSnapshots);
  const latestProposal = getLatestProposal(state.proposals);

  const onToggleViewMode = () => {
    const nextMode: 'split' | 'focus' = viewMode === 'split' ? 'focus' : 'split';
    updateSettings({ agent_view_mode: nextMode });
  };

  const createDraftPack = () => {
    if (!proposedPackDraft) return;
    addAgentPack({
      pack_id: `pack_${Math.random().toString(36).slice(2, 11)}`,
      created_at: new Date().toISOString(),
      kind: proposedPackDraft.kind,
      title: proposedPackDraft.title,
      content_markdown: ensurePackSections(proposedPackDraft.content_markdown),
      inputs: {
        snapshot_id: latestSnapshot?.snapshot_id,
        selected_goals: proposedPackDraft.selected_goals ?? [proposedPackDraft.source_input],
      },
      status: 'draft',
    });
    setProposedPackDraft(null);
  };

  const setPackStatus = (pack_id: string, status: AgentPack['status'], note?: string) => {
    setAgentPackStatus(pack_id, status, note);
  };

  if (!state.isLoaded || !sessionsHydrated) {
    return <div className="h-[calc(100vh-64px)] animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50" data-testid="agent-page">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-4 mt-4 rounded-t-2xl border border-b-0 border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Diviora Agent</h2>
              <p className="text-[11px] text-gray-500">Chat is the main surface. Artifacts and memory are contextual.</p>
            </div>
            <button
              data-testid="agent-focus-toggle"
              onClick={onToggleViewMode}
              className="rounded border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50"
            >
              {viewMode === 'focus' ? 'Split' : 'Focus'}
            </button>
          </div>
        </div>

        <div className="mx-4 mb-4 flex min-h-0 flex-1 rounded-b-2xl border border-gray-200 bg-white">
          <CopilotKit
            runtimeUrl="/api/copilot"
            threadId={currentSessionId || undefined}
            headers={headers}
            properties={{ contextPacket }}
          >
            <CopilotErrorUX />
            <CopilotContextHandler />
            <div className="min-w-0 flex-1" data-testid="agent-chat-main">
              <CopilotChat
                className="h-full border-none shadow-none"
                instructions="You are Diviora Agent. Use project memory and latest proposal context to help the user draft next steps. Never auto-run actions that mutate state."
                labels={{
                  title: 'Diviora Agent',
                  initial: 'I can use your latest memory snapshot and artifact context to help draft, reason, and plan.',
                  placeholder: 'Ask Diviora Agent...',
                }}
              />
            </div>
          </CopilotKit>
        </div>
      </div>

      {viewMode === 'split' && (
        <aside data-testid="agent-right-panel" className="w-[430px] border-l border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex gap-1">
              <TabButton tab={tab} value="memory" onClick={setTab} label="Memory" testId="agent-tab-memory" />
              <TabButton tab={tab} value="proposal" onClick={setTab} label="Proposal" testId="agent-tab-proposal" />
              <TabButton tab={tab} value="approvals" onClick={setTab} label="Approvals" testId="agent-tab-approvals" />
              <TabButton tab={tab} value="runs" onClick={setTab} label="Runs" testId="agent-tab-runs" />
              <TabButton tab={tab} value="packs" onClick={setTab} label="Packs" testId="agent-tab-packs" />
            </div>
          </div>

          <div className="h-[calc(100%-49px)] overflow-y-auto p-3 text-sm">
            {tab === 'memory' && (
              <div data-testid="agent-memory-panel" className="space-y-3">
                {latestSnapshot ? (
                  <>
                    <div className="text-xs text-gray-600">
                      branch: <span className="font-mono">{latestSnapshot.branch ?? 'n/a'}</span>
                      <br />
                      sha: <span className="font-mono">{latestSnapshot.head_sha ?? 'n/a'}</span>
                    </div>
                    <pre className="max-h-[480px] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs whitespace-pre-wrap">
                      {latestSnapshot.raw_markdown}
                    </pre>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">No project memory yet. Save one in <Link className="text-blue-600 underline" href="/memory">Memory</Link>.</div>
                )}
              </div>
            )}

            {tab === 'proposal' && (
              <div data-testid="agent-proposal-panel" className="space-y-3">
                {latestProposal ? (
                  <>
                    <div className="text-xs text-gray-600">
                      template: <span className="font-mono">{latestProposal.proposal.template_id ?? 'generic'}</span>
                    </div>
                    <ProposalRenderer proposal={latestProposal} isLatest={false} density="dense" />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">No proposals yet.</div>
                )}
              </div>
            )}

            {tab === 'approvals' && (
              <div data-testid="agent-approvals-panel" className="space-y-2">
                {state.decisions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">No approvals yet.</div>
                ) : (
                  state.decisions.slice(0, 12).map((decision) => (
                    <div key={decision.decision_id} className="rounded-lg border border-gray-200 p-3 text-xs">
                      <div className="font-semibold text-gray-900">{decision.status.toUpperCase()}</div>
                      <div className="mt-1 font-mono text-gray-500">proposal: {decision.proposal_id}</div>
                      {decision.note && <div className="mt-2 text-gray-700">{decision.note}</div>}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'runs' && (
              <div data-testid="agent-runs-panel" className="space-y-2">
                {state.runs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">No runs yet.</div>
                ) : (
                  state.runs.slice(0, 12).map((run) => (
                    <Link key={run.run_id} href={`/runs/${run.run_id}`} className="block rounded-lg border border-gray-200 p-3 text-xs hover:bg-gray-50">
                      <div className="font-semibold text-gray-900">{run.plan.objective}</div>
                      <div className="mt-1 font-mono text-gray-500">run: {run.run_id}</div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {tab === 'packs' && (
              <AgentPacksPanel
                packs={state.agentPacks}
                latestSnapshotId={latestSnapshot?.snapshot_id}
                proposedDraft={proposedPackDraft}
                onCreateDraftPack={createDraftPack}
                onSetStatus={setPackStatus}
              />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function TabButton({
  tab,
  value,
  onClick,
  label,
  testId,
}: {
  tab: AgentTab;
  value: AgentTab;
  onClick: (value: AgentTab) => void;
  label: string;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={() => onClick(value)}
      className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
        tab === value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

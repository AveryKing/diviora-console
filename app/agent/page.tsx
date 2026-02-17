'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';
import dynamic from 'next/dynamic';
import { Bot, ChevronsLeft, ChevronsRight, FolderKanban, Home, MemoryStick, Scale, Settings, Workflow } from 'lucide-react';
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
import { generateCodexTaskPacket } from '@/lib/codex_task_packet';

const CopilotChat = dynamic(
  () => import('@copilotkit/react-ui').then((module) => module.CopilotChat),
  {
    ssr: false,
    loading: () => (
      <div className="h-full animate-pulse bg-[linear-gradient(180deg,rgba(24,24,27,0.7),rgba(9,9,11,0.8))]" />
    ),
  }
);

type AgentTab = 'memory' | 'proposal' | 'approvals' | 'runs' | 'packs';

type ProposedAgentPackDraft = {
  kind: AgentPack['kind'];
  title: string;
  content_markdown: string;
  selected_goals?: string[];
  source_input: string;
};

const shellLinks = [
  { href: '/agent', label: 'Agent', icon: Bot },
  { href: '/', label: 'Home', icon: Home },
  { href: '/artifacts', label: 'Artifacts', icon: FolderKanban },
  { href: '/approvals', label: 'Approvals', icon: Scale },
  { href: '/runs', label: 'Runs', icon: Workflow },
  { href: '/memory', label: 'Memory', icon: MemoryStick },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AgentPage() {
  const { state, updateSettings, addAgentPack, setAgentPackStatus, setAgentPackCodexTaskPacket } = useStore();
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const hasSessions = useSessionStore((s) => s.sessions.length > 0);
  const firstSessionId = useSessionStore((s) => s.sessions[0]?.session_id ?? null);
  const sessionActions = useSessionStore((s) => s.actions);
  const sessionsHydrated = useSessionStore((s) => s.hydrated);

  const authToken = process.env.NEXT_PUBLIC_DIVIORA_CONSOLE_AUTH_TOKEN;
  const headers = authToken ? { 'X-DIVIORA-AUTH': authToken } : undefined;

  const [tab, setTab] = useState<AgentTab>('memory');
  const [navCollapsed, setNavCollapsed] = useState(false);
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

  const onGenerateCodexTaskPacket = (pack_id: string) => {
    const pack = state.agentPacks.find((candidate) => candidate.pack_id === pack_id);
    if (!pack) return;
    if (pack.kind !== 'issue' || pack.status !== 'approved') return;
    setAgentPackCodexTaskPacket(pack.pack_id, generateCodexTaskPacket(pack));
  };

  if (!state.isLoaded) {
    return <div className="fixed inset-0 z-[70] animate-pulse bg-zinc-950" />;
  }

  return (
    <div
      className="agent-shell fixed inset-0 z-[70] flex overflow-hidden bg-[radial-gradient(circle_at_8%_8%,rgba(8,145,178,0.22),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.16),transparent_34%),#05070b] text-zinc-100"
      data-testid="agent-page"
    >
      <aside
        className={`relative hidden shrink-0 border-r border-zinc-800/90 bg-zinc-950/88 p-3 backdrop-blur lg:flex lg:flex-col ${
          navCollapsed ? 'w-[88px]' : 'w-[270px]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-2 pb-4 pt-2">
          <div className={`flex items-center gap-2 ${navCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-200">
              <Bot className="h-5 w-5" />
            </div>
            {!navCollapsed && (
              <div>
                <div className="text-sm font-semibold tracking-wide">Diviora</div>
                <div className="text-[11px] uppercase tracking-wider text-zinc-400">Agent Console</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setNavCollapsed((value) => !value)}
            data-testid="agent-nav-collapse"
            className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-1.5 text-zinc-300 hover:border-zinc-500"
          >
            {navCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="space-y-1">
          {shellLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900/80 hover:text-zinc-100"
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-cyan-300" />
                {!navCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400">Status</div>
          <div className="mt-2 text-xs text-zinc-300">Session: {currentSessionId ? 'Active' : 'Initializing'}</div>
          <div className="mt-1 text-xs text-zinc-300">Memory: {latestSnapshot ? 'Ready' : 'Missing'}</div>
          <div className="mt-1 text-xs text-zinc-300">Packs: {state.agentPacks.length}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 overflow-hidden p-3 lg:p-4">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/78 shadow-[0_0_0_1px_rgba(63,63,70,0.45),0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800/90 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Diviora Agent</h2>
              <p className="text-[11px] text-zinc-400">Enterprise workspace for context-aware planning and approvals.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                {latestSnapshot ? 'Memory Loaded' : 'No Memory'}
              </span>
              <span className="rounded-full border border-zinc-700 bg-zinc-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                {latestProposal ? 'Proposal Ready' : 'No Proposal'}
              </span>
              <button
                data-testid="agent-focus-toggle"
                onClick={onToggleViewMode}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                {viewMode === 'focus' ? 'Split' : 'Focus'}
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="agent-chat-surface min-w-0 flex-1" data-testid="agent-chat-main">
              <CopilotKit
                runtimeUrl="/api/copilot"
                threadId={currentSessionId || undefined}
                headers={headers}
                properties={{ contextPacket }}
              >
                <CopilotErrorUX />
                <CopilotContextHandler />
                <CopilotChat
                  className="h-full border-none shadow-none"
                  instructions="You are Diviora Agent. Use project memory and latest proposal context to help the user draft next steps. Never auto-run actions that mutate state."
                  labels={{
                    title: 'Diviora Agent',
                    initial: 'I can use your latest memory snapshot and artifact context to help draft, reason, and plan.',
                    placeholder: 'Ask Diviora Agent...',
                  }}
                />
              </CopilotKit>
            </div>

            {viewMode === 'split' && (
              <aside data-testid="agent-right-panel" className="w-[430px] border-l border-zinc-800/90 bg-zinc-950/98">
                <div className="border-b border-zinc-800 px-3 py-2">
                  <div className="flex gap-1">
                    <TabButton tab={tab} value="memory" onClick={setTab} label="Memory" testId="agent-tab-memory" />
                    <TabButton tab={tab} value="proposal" onClick={setTab} label="Proposal" testId="agent-tab-proposal" />
                    <TabButton tab={tab} value="approvals" onClick={setTab} label="Approvals" testId="agent-tab-approvals" />
                    <TabButton tab={tab} value="runs" onClick={setTab} label="Runs" testId="agent-tab-runs" />
                    <TabButton tab={tab} value="packs" onClick={setTab} label="Packs" testId="agent-tab-packs" />
                  </div>
                </div>

                <div className="h-[calc(100%-49px)] overflow-y-auto p-3 text-sm text-zinc-200">
                  {tab === 'memory' && (
                    <div data-testid="agent-memory-panel" className="space-y-3">
                      {latestSnapshot ? (
                        <>
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
                            branch: <span className="font-mono">{latestSnapshot.branch ?? 'n/a'}</span>
                            <br />
                            sha: <span className="font-mono">{latestSnapshot.head_sha ?? 'n/a'}</span>
                          </div>
                          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-300">
                            {latestSnapshot.raw_markdown}
                          </pre>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">No project memory yet. Save one in <Link className="text-cyan-300 underline" href="/memory">Memory</Link>.</div>
                      )}
                    </div>
                  )}

                  {tab === 'proposal' && (
                    <div data-testid="agent-proposal-panel" className="space-y-3">
                      {latestProposal ? (
                        <>
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-400">
                            template: <span className="font-mono">{latestProposal.proposal.template_id ?? 'generic'}</span>
                          </div>
                          <ProposalRenderer proposal={latestProposal} isLatest={false} density="dense" />
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">No proposals yet.</div>
                      )}
                    </div>
                  )}

                  {tab === 'approvals' && (
                    <div data-testid="agent-approvals-panel" className="space-y-2">
                      {state.decisions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">No approvals yet.</div>
                      ) : (
                        state.decisions.slice(0, 12).map((decision) => (
                          <div key={decision.decision_id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs">
                            <div className="font-semibold text-zinc-100">{decision.status.toUpperCase()}</div>
                            <div className="mt-1 font-mono text-zinc-400">proposal: {decision.proposal_id}</div>
                            {decision.note && <div className="mt-2 text-zinc-300">{decision.note}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {tab === 'runs' && (
                    <div data-testid="agent-runs-panel" className="space-y-2">
                      {state.runs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">No runs yet.</div>
                      ) : (
                        state.runs.slice(0, 12).map((run) => (
                          <Link key={run.run_id} href={`/runs/${run.run_id}`} className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs transition hover:border-zinc-700 hover:bg-zinc-900">
                            <div className="font-semibold text-zinc-100">{run.plan.objective}</div>
                            <div className="mt-1 font-mono text-zinc-400">run: {run.run_id}</div>
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
                      onGenerateCodexTaskPacket={onGenerateCodexTaskPacket}
                    />
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
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
      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
        tab === value
          ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
          : 'border border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

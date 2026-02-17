'use client';

import { useMemo, useState } from 'react';
import { AgentPack } from '@/lib/types';

type ProposedAgentPackDraft = {
  kind: AgentPack['kind'];
  title: string;
  content_markdown: string;
  selected_goals?: string[];
  source_input: string;
};

type AgentPacksPanelProps = {
  packs: AgentPack[];
  latestSnapshotId?: string;
  proposedDraft: ProposedAgentPackDraft | null;
  onCreateDraftPack: () => void;
  onSetStatus: (pack_id: string, status: AgentPack['status'], note?: string) => void;
  onGenerateCodexTaskPacket: (pack_id: string) => void;
};

function statusStyle(status: AgentPack['status']): string {
  if (status === 'approved') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  if (status === 'rejected') return 'bg-red-500/15 text-red-300 border-red-500/40';
  if (status === 'dispatched') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
  return 'bg-zinc-800 text-zinc-300 border-zinc-700';
}

export function AgentPacksPanel({
  packs,
  latestSnapshotId,
  proposedDraft,
  onCreateDraftPack,
  onSetStatus,
  onGenerateCodexTaskPacket,
}: AgentPacksPanelProps) {
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.pack_id ?? null);
  const [noteInput, setNoteInput] = useState('');
  const resolvedPackId = selectedPackId && packs.some((pack) => pack.pack_id === selectedPackId) ? selectedPackId : packs[0]?.pack_id ?? null;

  const selectedPack = useMemo(
    () => packs.find((pack) => pack.pack_id === resolvedPackId) ?? null,
    [packs, resolvedPackId]
  );

  const onApprove = () => {
    if (!selectedPack) return;
    onSetStatus(selectedPack.pack_id, 'approved', noteInput.trim() || undefined);
  };

  const onReject = () => {
    if (!selectedPack) return;
    onSetStatus(selectedPack.pack_id, 'rejected', noteInput.trim() || undefined);
  };

  return (
    <div data-testid="agent-packs-panel" className="space-y-3 text-zinc-200">
      {!latestSnapshotId && (
        <div data-testid="agent-pack-context-warning" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Context missing: no project snapshot found. You can still create a pack draft.
        </div>
      )}

      {proposedDraft && (
        <div data-testid="agent-pack-proposed" className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Proposed Draft Pack</div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">{proposedDraft.title}</div>
          <div className="mt-1 text-xs text-cyan-200/80">kind: {proposedDraft.kind}</div>
          <button
            data-testid="agent-pack-create-draft"
            onClick={onCreateDraftPack}
            className="mt-3 rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
          >
            Create Draft Pack
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2" data-testid="agent-packs-list">
          {packs.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">No packs yet.</div>
          )}
          {packs.map((pack) => (
            <button
              key={pack.pack_id}
              data-testid={`agent-pack-list-item-${pack.pack_id}`}
              onClick={() => setSelectedPackId(pack.pack_id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                resolvedPackId === pack.pack_id ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="text-sm font-semibold text-zinc-100">{pack.title}</div>
              <div className="mt-1 text-[11px] text-zinc-400">{pack.kind.replace('_', ' ')} · {new Date(pack.created_at).toLocaleString()}</div>
              <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(pack.status)}`}>
                {pack.status}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3" data-testid="agent-pack-detail">
          {!selectedPack ? (
            <div className="text-xs text-zinc-400">Select a pack to view details.</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-zinc-100">{selectedPack.title}</h4>
                <span data-testid="agent-pack-status-badge" className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(selectedPack.status)}`}>
                  {selectedPack.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">kind: {selectedPack.kind}</div>
              <div className="mt-2 text-xs text-zinc-400">snapshot: {selectedPack.inputs.snapshot_id ?? 'context missing'}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  data-testid="agent-pack-copy"
                  onClick={() => void navigator.clipboard.writeText(selectedPack.content_markdown)}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                >
                  Copy markdown
                </button>
                {selectedPack.kind === 'issue' && selectedPack.status === 'approved' && (
                  <button
                    data-testid="agent-pack-generate-codex-task-packet"
                    onClick={() => onGenerateCodexTaskPacket(selectedPack.pack_id)}
                    className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-2 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/30"
                  >
                    Generate Codex Task Packet
                  </button>
                )}
              </div>

              <textarea
                data-testid="agent-pack-note-input"
                className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-500"
                placeholder="Approval/rejection note"
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
              />

              <div className="mt-2 flex gap-2">
                <button
                  data-testid="agent-pack-approve"
                  onClick={onApprove}
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                >
                  Approve
                </button>
                <button
                  data-testid="agent-pack-reject"
                  onClick={onReject}
                  className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/30"
                >
                  Reject
                </button>
              </div>

              <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">
                {selectedPack.content_markdown}
              </pre>
              {selectedPack.codex_task_packet_markdown && (
                <>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-zinc-300">Codex Task Packet</div>
                    <button
                      data-testid="agent-pack-copy-codex-task-packet"
                      onClick={() => void navigator.clipboard.writeText(selectedPack.codex_task_packet_markdown ?? '')}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:border-zinc-500"
                    >
                      Copy packet
                    </button>
                  </div>
                  <pre data-testid="agent-pack-codex-task-packet" className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2 text-xs text-cyan-100">
                    {selectedPack.codex_task_packet_markdown}
                  </pre>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

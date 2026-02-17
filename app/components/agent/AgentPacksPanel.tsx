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
};

function statusStyle(status: AgentPack['status']): string {
  if (status === 'approved') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

export function AgentPacksPanel({
  packs,
  latestSnapshotId,
  proposedDraft,
  onCreateDraftPack,
  onSetStatus,
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
    <div data-testid="agent-packs-panel" className="space-y-3">
      {!latestSnapshotId && (
        <div data-testid="agent-pack-context-warning" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Context missing: no project snapshot found. You can still create a pack draft.
        </div>
      )}

      {proposedDraft && (
        <div data-testid="agent-pack-proposed" className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-900">Proposed Draft Pack</div>
          <div className="mt-1 text-sm font-semibold text-blue-900">{proposedDraft.title}</div>
          <div className="mt-1 text-xs text-blue-800">kind: {proposedDraft.kind}</div>
          <button
            data-testid="agent-pack-create-draft"
            onClick={onCreateDraftPack}
            className="mt-3 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Create Draft Pack
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2" data-testid="agent-packs-list">
          {packs.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">No packs yet.</div>
          )}
          {packs.map((pack) => (
            <button
              key={pack.pack_id}
              data-testid={`agent-pack-list-item-${pack.pack_id}`}
              onClick={() => setSelectedPackId(pack.pack_id)}
              className={`w-full rounded-lg border p-3 text-left ${
                resolvedPackId === pack.pack_id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">{pack.title}</div>
              <div className="mt-1 text-[11px] text-gray-500">{pack.kind.replace('_', ' ')} · {new Date(pack.created_at).toLocaleString()}</div>
              <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(pack.status)}`}>
                {pack.status}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 p-3" data-testid="agent-pack-detail">
          {!selectedPack ? (
            <div className="text-xs text-gray-500">Select a pack to view details.</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-gray-900">{selectedPack.title}</h4>
                <span data-testid="agent-pack-status-badge" className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyle(selectedPack.status)}`}>
                  {selectedPack.status}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">kind: {selectedPack.kind}</div>
              <div className="mt-2 text-xs text-gray-500">snapshot: {selectedPack.inputs.snapshot_id ?? 'context missing'}</div>
              <div className="mt-2 flex gap-2">
                <button
                  data-testid="agent-pack-copy"
                  onClick={() => void navigator.clipboard.writeText(selectedPack.content_markdown)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Copy markdown
                </button>
              </div>

              <textarea
                data-testid="agent-pack-note-input"
                className="mt-3 w-full rounded border border-gray-200 p-2 text-xs"
                placeholder="Approval/rejection note"
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
              />

              <div className="mt-2 flex gap-2">
                <button
                  data-testid="agent-pack-approve"
                  onClick={onApprove}
                  className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  data-testid="agent-pack-reject"
                  onClick={onReject}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>

              <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800">
                {selectedPack.content_markdown}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

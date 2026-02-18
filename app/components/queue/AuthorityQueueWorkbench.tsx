'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { AgentPack } from '@/lib/types';
import { AuthorityItem } from '@/lib/authority_queue';
import { canApprovePack, canDispatchPack, canRejectPack } from '@/lib/authority_queue_policy';

type Props = {
  items: AuthorityItem[];
  packsById: Record<string, AgentPack>;
  onSetStatus: (pack_id: string, status: AgentPack['status'], approval_note?: string) => void;
  onDispatch: (pack_id: string) => Promise<void>;
};

export function AuthorityQueueWorkbench({ items, packsById, onSetStatus, onDispatch }: Props) {
  const [noteByPack, setNoteByPack] = useState<Record<string, string>>({});
  const [errorByPack, setErrorByPack] = useState<Record<string, string>>({});

  const sections = useMemo(() => ({
    needsApproval: items.filter((item) => item.status === 'draft'),
    readyToDispatch: items.filter((item) => item.status === 'ready_to_dispatch'),
    completed: items.filter((item) => item.status === 'rejected' || item.status === 'dispatched'),
  }), [items]);

  const setError = (packId: string, message?: string) => {
    setErrorByPack((prev) => {
      const next = { ...prev };
      if (!message) {
        delete next[packId];
        return next;
      }
      next[packId] = message;
      return next;
    });
  };

  const handleApprove = (pack: AgentPack) => {
    const note = noteByPack[pack.pack_id] ?? '';
    const decision = canApprovePack(pack, note);
    if (!decision.allowed) {
      setError(pack.pack_id, decision.reason);
      return;
    }
    setError(pack.pack_id);
    onSetStatus(pack.pack_id, 'approved', note.trim());
  };

  const handleReject = (pack: AgentPack) => {
    const note = noteByPack[pack.pack_id] ?? '';
    const decision = canRejectPack(pack, note);
    if (!decision.allowed) {
      setError(pack.pack_id, decision.reason);
      return;
    }
    setError(pack.pack_id);
    onSetStatus(pack.pack_id, 'rejected', note.trim());
  };

  const handleDispatch = async (pack: AgentPack, blockers: string[]) => {
    if (blockers.length > 0) {
      setError(pack.pack_id, blockers[0]);
      return;
    }
    const decision = canDispatchPack(pack);
    if (!decision.allowed) {
      setError(pack.pack_id, decision.reason);
      return;
    }

    try {
      setError(pack.pack_id);
      await onDispatch(pack.pack_id);
    } catch (error) {
      setError(pack.pack_id, error instanceof Error ? error.message : 'Dispatch failed');
    }
  };

  return (
    <div className="space-y-8" data-testid="authority-queue-workbench">
      <QueueSection title="Needs Approval" items={sections.needsApproval} renderRow={(item) => {
        const pack = packsById[item.refs.pack_id];
        if (!pack) return null;
        return (
          <QueueRow
            key={item.item_id}
            item={item}
            noteValue={noteByPack[pack.pack_id] ?? ''}
            error={errorByPack[pack.pack_id]}
            onNoteChange={(value) => setNoteByPack((prev) => ({ ...prev, [pack.pack_id]: value }))}
            onApprove={() => handleApprove(pack)}
            onReject={() => handleReject(pack)}
          />
        );
      }} />

      <QueueSection title="Ready to Dispatch" items={sections.readyToDispatch} renderRow={(item) => {
        const pack = packsById[item.refs.pack_id];
        if (!pack) return null;
        return (
          <QueueRow
            key={item.item_id}
            item={item}
            noteValue={pack.approval_note ?? ''}
            noteReadOnly
            error={errorByPack[pack.pack_id]}
            onDispatch={() => void handleDispatch(pack, item.blockers)}
          />
        );
      }} />

      <QueueSection title="Completed" items={sections.completed} renderRow={(item) => {
        const pack = packsById[item.refs.pack_id];
        if (!pack) return null;
        return (
          <QueueRow
            key={item.item_id}
            item={item}
            noteValue={pack.approval_note ?? ''}
            noteReadOnly
          />
        );
      }} />
    </div>
  );
}

function QueueSection({ title, items, renderRow }: { title: string; items: AuthorityItem[]; renderRow: (item: AuthorityItem) => ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">No items.</div>
        )}
        {items.map((item) => renderRow(item))}
      </div>
    </section>
  );
}

type RowProps = {
  item: AuthorityItem;
  noteValue: string;
  noteReadOnly?: boolean;
  error?: string;
  onNoteChange?: (value: string) => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDispatch?: () => void;
};

function QueueRow({ item, noteValue, noteReadOnly, error, onNoteChange, onApprove, onReject, onDispatch }: RowProps) {
  const actionsDisabled = item.blockers.length > 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" data-testid={`authority-item-${item.refs.pack_id}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
          <p className="mt-1 text-xs text-gray-500">{item.kind} · {new Date(item.created_at).toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-500">
            refs: pack={item.refs.pack_id}
            {item.refs.snapshot_id ? ` · snapshot=${item.refs.snapshot_id}` : ''}
            {item.refs.proposal_id ? ` · proposal=${item.refs.proposal_id}` : ''}
            {item.refs.dispatch_id ? ` · dispatch=${item.refs.dispatch_id}` : ''}
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold uppercase text-gray-700">{item.status}</span>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-gray-700">Decision note</label>
        <textarea
          className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          value={noteValue}
          placeholder="Required for approve/reject"
          readOnly={noteReadOnly}
          onChange={(event) => onNoteChange?.(event.target.value)}
          data-testid={`authority-note-${item.refs.pack_id}`}
        />
      </div>

      {item.blockers.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-700" data-testid={`authority-blockers-${item.refs.pack_id}`}>
          {item.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {onApprove && (
          <button data-testid={`authority-approve-${item.refs.pack_id}`} onClick={onApprove} disabled={actionsDisabled} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            Approve
          </button>
        )}
        {onReject && (
          <button data-testid={`authority-reject-${item.refs.pack_id}`} onClick={onReject} disabled={actionsDisabled} className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            Reject
          </button>
        )}
        {onDispatch && (
          <button data-testid={`authority-dispatch-${item.refs.pack_id}`} onClick={onDispatch} disabled={actionsDisabled} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Dispatch
          </button>
        )}
      </div>
    </article>
  );
}

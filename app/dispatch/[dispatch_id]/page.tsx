'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function DispatchDetailPage() {
  const params = useParams<{ dispatch_id: string }>();
  const dispatchId = params.dispatch_id;
  const { state, markDispatchSent, markDispatchAcked, markDispatchFailed, cancelDispatch } = useStore();
  const [errorInput, setErrorInput] = useState('');

  const record = useMemo(
    () => state.dispatchRecords.find((candidate) => candidate.dispatch_id === dispatchId),
    [state.dispatchRecords, dispatchId]
  );

  if (!state.isLoaded) {
    return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Dispatch not found</h1>
        <Link href="/dispatch" className="text-sm text-blue-600">Back to Dispatch Ledger</Link>
      </div>
    );
  }

  const canMarkSent = record.status === 'queued';
  const canMarkAcked = record.status === 'sent';
  const canMarkFailed = record.status === 'queued' || record.status === 'sent';
  const canCancel = record.status === 'queued' || record.status === 'sent';

  return (
    <div className="space-y-4" data-testid="dispatch-detail-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dispatch {record.dispatch_id}</h1>
        <p className="text-sm text-gray-500">pack={record.pack_id} · destination={record.destination}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-600">Payload Hash (SHA-256)</p>
        <p className="mt-1 break-all font-mono text-xs text-gray-900" data-testid="dispatch-payload-hash">{record.payload_hash}</p>
        <button onClick={() => void navigator.clipboard.writeText(record.payload_json)} className="mt-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700" data-testid="dispatch-copy-payload">
          Copy payload JSON
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-600">Status timeline</p>
        <ol className="mt-2 space-y-2 text-xs text-gray-700" data-testid="dispatch-status-timeline">
          {record.transitions.map((transition, index) => (
            <li key={`${transition.status}-${transition.at}-${index}`}>
              {transition.status.toUpperCase()} @ {new Date(transition.at).toLocaleString()}
              {transition.error ? ` (${transition.error})` : ''}
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-600">Operator controls</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button data-testid="dispatch-mark-sent" onClick={() => markDispatchSent(record.dispatch_id)} disabled={!canMarkSent} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 disabled:opacity-50">Mark Sent</button>
          <button data-testid="dispatch-mark-acked" onClick={() => markDispatchAcked(record.dispatch_id)} disabled={!canMarkAcked} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50">Mark Acked</button>
          <button data-testid="dispatch-cancel" onClick={() => cancelDispatch(record.dispatch_id)} disabled={!canCancel} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 disabled:opacity-50">Cancel</button>
        </div>

        <div className="mt-3 space-y-2">
          <input value={errorInput} onChange={(event) => setErrorInput(event.target.value)} placeholder="Failure reason" className="w-full rounded-lg border border-gray-300 p-2 text-sm" data-testid="dispatch-failure-input" />
          <button data-testid="dispatch-mark-failed" onClick={() => markDispatchFailed(record.dispatch_id, errorInput.trim() || 'Operator marked failed')} disabled={!canMarkFailed} className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-50">Mark Failed</button>
        </div>
      </div>

      <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700" data-testid="dispatch-payload-json">
        {record.payload_json}
      </pre>

      <Link href="/dispatch" className="text-sm text-blue-600">Back to Dispatch Ledger</Link>
    </div>
  );
}

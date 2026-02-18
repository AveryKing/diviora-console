'use client';

import Link from 'next/link';
import { getDispatchHistoryLine } from '@/lib/dispatch';
import { useStore } from '@/lib/store';

export default function DispatchListPage() {
  const { state } = useStore();

  if (!state.isLoaded) {
    return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dispatch Ledger</h1>
      <div className="space-y-3">
        {state.dispatchRecords.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">No dispatch records yet.</div>
        )}
        {state.dispatchRecords.map((record) => (
          <Link key={record.dispatch_id} href={`/dispatch/${record.dispatch_id}`} className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50" data-testid={`dispatch-row-${record.dispatch_id}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{record.dispatch_id}</p>
                <p className="text-xs text-gray-500">pack={record.pack_id} · destination={record.destination}</p>
                <p className="text-xs text-gray-500">hash={record.payload_hash}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold uppercase text-gray-700">{getDispatchHistoryLine(record)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

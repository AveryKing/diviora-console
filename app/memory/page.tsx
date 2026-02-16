'use client';

import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { buildProjectSnapshot } from '@/lib/project_memory';

function shortSha(sha?: string): string {
  if (!sha) return 'n/a';
  return sha.slice(0, 10);
}

export default function MemoryPage() {
  const { state, addProjectSnapshot, deleteProjectSnapshot } = useStore();
  const [input, setInput] = useState('');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const snapshots = state.projectSnapshots;
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshot_id === selectedSnapshotId) ?? null,
    [snapshots, selectedSnapshotId]
  );

  const saveSnapshot = (source: 'manual_paste' | 'import_file', raw: string) => {
    if (!raw.trim()) {
      setStatus({ type: 'error', message: 'Snapshot content is required.' });
      return;
    }

    const snapshot = buildProjectSnapshot({ source, raw });
    addProjectSnapshot(snapshot);
    setSelectedSnapshotId(snapshot.snapshot_id);
    setInput('');
    setStatus({ type: 'success', message: 'Snapshot saved.' });
  };

  const onSaveClick = () => {
    saveSnapshot('manual_paste', input);
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      saveSnapshot('import_file', content);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const onDeleteSelected = () => {
    if (!selectedSnapshot) return;
    deleteProjectSnapshot(selectedSnapshot.snapshot_id);
    setSelectedSnapshotId(null);
    setStatus({ type: 'success', message: 'Snapshot deleted.' });
  };

  const onCopySelected = async () => {
    if (!selectedSnapshot) return;
    await navigator.clipboard.writeText(selectedSnapshot.raw_markdown);
    setStatus({ type: 'success', message: 'Snapshot copied.' });
  };

  if (!state.isLoaded) {
    return <div className="animate-pulse h-40 rounded-xl bg-gray-100" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Memory</h2>
        <p className="text-sm text-gray-500">Store STATE_SNAPSHOT.md and JSON snapshots as timestamped records.</p>
      </div>

      {status && (
        <div
          data-testid="memory-status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">Add Snapshot</h3>
        <textarea
          data-testid="memory-paste-input"
          className="h-44 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="Paste STATE_SNAPSHOT.md or JSON snapshot"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <div className="mt-3 flex gap-3">
          <button
            data-testid="memory-save-button"
            onClick={onSaveClick}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Snapshot
          </button>
          <button
            data-testid="memory-import-button"
            onClick={onImportClick}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Import File (.md/.json)
          </button>
          <input
            ref={fileInputRef}
            data-testid="memory-file-input"
            type="file"
            accept=".md,.markdown,.json,text/markdown,application/json,text/plain"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">Saved Snapshots</h3>
          <ul className="space-y-3" data-testid="memory-list">
            {snapshots.length === 0 && <li className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">No snapshots yet.</li>}
            {snapshots.map((snapshot) => (
              <li key={snapshot.snapshot_id}>
                <button
                  data-testid={`memory-list-item-${snapshot.snapshot_id}`}
                  onClick={() => setSelectedSnapshotId(snapshot.snapshot_id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedSnapshotId === snapshot.snapshot_id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900">{snapshot.branch || 'unknown branch'}</span>
                    <span className="text-xs text-gray-500">{new Date(snapshot.created_at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    sha: <span className="font-mono">{shortSha(snapshot.head_sha)}</span>
                    {' · '}
                    parse: {snapshot.parsed_summary?.parse_status ?? 'unparsed'}
                  </div>
                  {snapshot.parsed_summary?.gate_statuses && snapshot.parsed_summary.gate_statuses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {snapshot.parsed_summary.gate_statuses.map((gate) => (
                        <span key={`${snapshot.snapshot_id}-${gate.gate}`} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          {gate.gate}:{gate.status}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">Snapshot Detail</h3>
          {!selectedSnapshot && <p className="text-sm text-gray-500">Select a snapshot from the list.</p>}
          {selectedSnapshot && (
            <div data-testid="memory-detail" className="space-y-3">
              <div className="text-xs text-gray-600">
                repo: <span className="font-mono">{selectedSnapshot.repo_name || 'n/a'}</span>
                <br />
                branch: <span className="font-mono">{selectedSnapshot.branch || 'n/a'}</span>
                <br />
                sha: <span className="font-mono">{selectedSnapshot.head_sha || 'n/a'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  data-testid="memory-copy-button"
                  onClick={() => void onCopySelected()}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Copy
                </button>
                <button
                  data-testid="memory-delete-button"
                  onClick={onDeleteSelected}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
                {selectedSnapshot.raw_markdown}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

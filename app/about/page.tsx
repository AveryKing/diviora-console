'use client';

import { useStore } from "../../lib/store";

export default function AboutPage() {
  const { state } = useStore();
  const { metadata, proposals, decisions, runs, settings } = state;

  const handleCopyDiagnostics = () => {
    const diagnostics = {
      app_version: "0.1.0",
      schemas: {
        settings: settings.schema_version,
        proposals: 1,
        decisions: 1,
        runs: 1,
      },
      counts: {
        proposals: proposals.length,
        decisions: decisions.length,
        runs: runs.length,
      },
      metadata: {
        last_exported_at: metadata.last_exported_at || "Never",
        last_imported_at: metadata.last_imported_at || "Never",
        last_imported_version: metadata.last_imported_version || "N/A",
      }
    };

    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    alert("Diagnostics copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">About Diviora Console</h2>
        <p className="text-gray-500">System information and diagnostic audit tools.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Version Info</h3>
              <dl className="space-y-4">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">App Version</dt>
                  <dd className="text-sm font-mono font-bold text-gray-900">0.1.0</dd>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">Settings Schema</dt>
                  <dd className="text-sm font-mono text-gray-900">v{settings.schema_version}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">Artifacts Schema</dt>
                  <dd className="text-sm font-mono text-gray-900">v1</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Activity Audit</h3>
              <dl className="space-y-4">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">Last Exported</dt>
                  <dd className="text-sm text-gray-900">{metadata.last_exported_at ? new Date(metadata.last_exported_at).toLocaleString() : 'Never'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">Last Imported</dt>
                  <dd className="text-sm text-gray-900">{metadata.last_imported_at ? new Date(metadata.last_imported_at).toLocaleString() : 'Never'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <dt className="text-sm text-gray-500">Import Version</dt>
                  <dd className="text-sm font-mono text-gray-900">{metadata.last_imported_version ? `v${metadata.last_imported_version}` : 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Data Inventory</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{decisions.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold">Run Plans</p>
                <p className="text-2xl font-bold text-gray-900">{runs.length}</p>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          <div className="flex justify-center">
            <button
              onClick={handleCopyDiagnostics}
              className="px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-sm active:transform active:scale-95 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Copy Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

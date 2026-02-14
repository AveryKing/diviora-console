'use client';

import { useStore } from "../../lib/store";
import { useRef, useState } from "react";

export default function SettingsPage() {
  const { state, updateSettings, resetAllData, exportSnapshot, importSnapshot } = useStore();
  const { settings, isLoaded } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (!isLoaded) {
    return <div className="animate-pulse flex space-y-4 flex-col">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number = value;
    
    if (name === 'default_step_count') {
      finalValue = parseInt(value, 10);
    }
    
    updateSettings({ [name]: finalValue });
  };

  const handleExport = () => {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    a.href = url;
    a.download = `diviora-snapshot-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (confirm("Importing a snapshot will OVERWRITE all current demo data (proposals, decisions, runs, and settings). Are you sure?")) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = importSnapshot(json);
        if (result.ok) {
          setImportStatus({ type: 'success', message: 'Snapshot imported successfully!' });
        } else {
          setImportStatus({ type: 'error', message: result.error });
        }
      } catch {
        setImportStatus({ type: 'error', message: 'Failed to parse JSON file.' });
      }
      // Reset input so the same file can be picked again
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-500">Configure how Diviora Console generates and displays artifacts.</p>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          importStatus.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-700'
        }`}>
          <span>{importStatus.type === 'success' ? '✅' : '❌'}</span>
          <p className="text-sm font-medium">{importStatus.message}</p>
          <button onClick={() => setImportStatus(null)} className="ml-auto text-xs opacity-50 hover:opacity-100">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Template Selection */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Output Template</h3>
              <p className="text-xs text-gray-500 mt-1">Select the structural template for new proposals.</p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <select
                name="template_id"
                data-testid="settings-template"
                value={settings.template_id || 'generic'}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="generic">Generic Proposal</option>
                <option value="sales_outreach">Sales Outreach</option>
                <option value="bug_triage">Bug Triage</option>
                <option value="project_plan">Project Plan</option>
              </select>
              <p className="text-xs text-blue-600">
                {settings.template_id === 'sales_outreach' && 'Optimized for ICP, Offer, and Sequence.'}
                {settings.template_id === 'bug_triage' && 'Optimized for Repro, Expected vs Actual, and Fix Plan.'}
                {settings.template_id === 'project_plan' && 'Optimized for Goals, Milestones, and Dependencies.'}
                {(settings.template_id === 'generic' || !settings.template_id) && 'Standard Summary, Actions, and Risk format.'}
              </p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Proposal Generation Style */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Proposal Style</h3>
              <p className="text-xs text-gray-500 mt-1">Controls the length and depth of generated summaries.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              {['concise', 'detailed'].map((style) => (
                <label key={style} data-testid={`settings-style-${style}`} className={`flex-1 flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  settings.proposal_style === style 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="proposal_style"
                    value={style}
                    checked={settings.proposal_style === style}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={`text-sm font-bold capitalize ${settings.proposal_style === style ? 'text-blue-700' : 'text-gray-900'}`}>{style}</span>
                </label>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Risk Sensitivity */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Risk Sensitivity</h3>
              <p className="text-xs text-gray-500 mt-1">Influences risk detection verbosity in proposals and runs.</p>
            </div>
            <div className="md:col-span-2">
              <select
                name="risk_level"
                data-testid="settings-risk"
                value={settings.risk_level}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="low">Low (Conservative)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Strict)</option>
              </select>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Default Step Count */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Step Granularity</h3>
              <p className="text-xs text-gray-500 mt-1">Define the default number of steps in any new artifact.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              {[3, 5, 7].map((num) => (
                <label key={num} data-testid={`settings-steps-${num}`} className={`flex-1 flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all ${
                  settings.default_step_count === num 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-500' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="default_step_count"
                    value={num}
                    checked={settings.default_step_count === num}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={`text-sm font-bold ${settings.default_step_count === num ? 'text-blue-700' : 'text-gray-900'}`}>{num} Steps</span>
                </label>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Timeline View Mode */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Timeline Zoom</h3>
              <p className="text-xs text-gray-500 mt-1">Change how history entries are displayed on the home page.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              {['compact', 'expanded'].map((mode) => (
                <button
                  key={mode}
                  data-testid={`settings-timeline-${mode}`}
                  onClick={() => updateSettings({ timeline_mode: mode as 'compact' | 'expanded' })}
                  className={`flex-1 p-3 text-sm font-medium border rounded-xl transition-all ${
                    settings.timeline_mode === mode 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Snapshot Management */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">State Bundles</h3>
              <p className="text-xs text-gray-500 mt-1">Export your full history or import a shared state bundle.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Snapshot
              </button>
              <button
                onClick={handleImportClick}
                className="flex-1 flex items-center justify-center gap-2 p-3 text-sm font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Snapshot
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </section>
        </div>

        <div className="p-8 bg-red-50/50 border-t border-red-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider">Danger Zone</h3>
              <p className="text-xs text-red-600">Permanently delete all proposals, decisions, and runs.</p>
            </div>
            <button
              onClick={resetAllData}
              data-testid="reset-all-data"
              className="px-6 py-3 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 shadow-sm active:transform active:scale-95 transition-all"
            >
              Reset All Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

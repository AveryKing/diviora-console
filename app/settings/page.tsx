'use client';

import { useStore } from "../../lib/store";

export default function SettingsPage() {
  const { state, updateSettings, resetAllData } = useStore();
  const { settings, isLoaded } = state;

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-500">Configure how Diviora Console generates and displays artifacts.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          {/* Proposal Generation Style */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Proposal Style</h3>
              <p className="text-xs text-gray-500 mt-1">Controls the length and depth of generated summaries.</p>
            </div>
            <div className="md:col-span-2 flex gap-4">
              {['concise', 'detailed'].map((style) => (
                <label key={style} className={`flex-1 flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${
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
                <label key={num} className={`flex-1 flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all ${
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
        </div>

        <div className="p-8 bg-red-50/50 border-t border-red-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider">Danger Zone</h3>
              <p className="text-xs text-red-600">Permanently delete all proposals, decisions, and runs.</p>
            </div>
            <button
              onClick={resetAllData}
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

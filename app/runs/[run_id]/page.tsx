'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '../../../lib/store';
import EmptyState from '../../components/EmptyState';
import Link from 'next/link';
import { useState } from 'react';

export default function RunDetailPage() {
  const { run_id } = useParams();
  const { state } = useStore();
  const router = useRouter();
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'happy_path' | 'flaky_inputs' | 'rate_limited' | 'validation_error'>('happy_path');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState(false);
  const [diffTargetId, setDiffTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Safely find run and related data
  const run = state.runs.find(r => r.run_id === run_id);
  const proposal = run ? state.proposals.find(p => p.proposal_id === run.proposal_id) : null;
  const allTranscripts = run ? state.transcripts.filter(t => t.run_id === run.run_id).sort((a,b) => b.attempt - a.attempt) : [];
  const latestTranscript = allTranscripts.length > 0 ? allTranscripts[0] : null;
  const currentTranscript = selectedAttemptId ? allTranscripts.find(t => t.transcript_id === selectedAttemptId) || latestTranscript : latestTranscript;
  
  const diffTargetTranscript = diffTargetId ? allTranscripts.find(t => t.transcript_id === diffTargetId) : null;

  const { generateTranscript } = useStore();

  const handleGenerateTranscript = () => {
    if (!run) return;
    try {
      const newT = generateTranscript(run.run_id, selectedScenario);
      setSelectedAttemptId(newT.transcript_id);
      setDiffMode(false);
      setError(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'PolicyError') {
        const policyErr = err as unknown as { decision: { reasons: string[]; policy_ids: string[] } };
        setError(`Policy Violation: ${policyErr.decision.reasons.join('; ')} (${policyErr.decision.policy_ids.join(', ')})`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate transcript');
      }
    }
  };

  const handleCopyTranscript = () => {
    if (!currentTranscript) return;
    navigator.clipboard.writeText(JSON.stringify(currentTranscript, null, 2));
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(run, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // derived state for outcome
  const getOutcome = (t: typeof currentTranscript) => {
      if (!t) return null;
      const hasError = t.events.some(e => e.level === 'error');
      const hasWarn = t.events.some(e => e.level === 'warn');
      if (hasError) return { label: 'FAILED', color: 'bg-red-500 text-white' };
      if (hasWarn) return { label: 'WARNING', color: 'bg-amber-400 text-white' };
      return { label: 'SUCCESS', color: 'bg-green-600 text-white' };
  };
  
  const outcome = getOutcome(currentTranscript);

  // Diff Logic
  const getDiffSummary = () => {
      if (!currentTranscript || !diffTargetTranscript) return null;
      const t1 = currentTranscript;
      const t2 = diffTargetTranscript;

      const getStats = (t: typeof currentTranscript) => {
          if (!t) return { error: 0, warn: 0, info: 0, firstError: '' };
          return {
              error: t.events.filter(e => e.level === 'error').length,
              warn: t.events.filter(e => e.level === 'warn').length,
              info: t.events.filter(e => e.level === 'info').length,
              firstError: t.events.find(e => e.level === 'error')?.message || ''
          };
      };

      const s1 = getStats(t1);
      const s2 = getStats(t2);

      return (
          <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-100 p-4 rounded mb-4">
              <div className="space-y-2">
                 <div className="font-bold underline text-gray-500">Attempt {t1.attempt} ({t1.scenario_id})</div>
                 <div>ERROR: {s1.error}</div>
                 <div>WARN:  {s1.warn}</div>
                 {s1.firstError && <div className="text-red-600 truncate" title={s1.firstError}>{s1.firstError}</div>}
              </div>
              <div className="space-y-2 border-l border-gray-300 pl-4">
                 <div className="font-bold underline text-gray-500">Attempt {t2.attempt} ({t2.scenario_id})</div>
                 <div>ERROR: {s2.error}</div>
                 <div>WARN:  {s2.warn}</div>
                 {s2.firstError && <div className="text-red-600 truncate" title={s2.firstError}>{s2.firstError}</div>}
              </div>
          </div>
      );
  };

  if (!state.isLoaded) {
    return <div className="animate-pulse flex space-y-4 flex-col">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="h-96 bg-gray-100 rounded-xl"></div>
    </div>;
  }

  if (!run) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <EmptyState
          title="Run Plan Not Found"
          description={`We couldn't find a run plan with ID "${run_id}". It may have been cleared or doesn't exist.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Runs
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy JSON
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {outcome ? (
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${outcome.color}`}>
                     {outcome.label}
                   </span>
              ) : (
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                currentTranscript ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {currentTranscript ? 'Executed' : run.status}
              </span>
              )}
              <span className="text-gray-400 text-sm font-mono">
                {run.run_id}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Scenario Selector */}
                 <select 
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value as 'happy_path' | 'flaky_inputs' | 'rate_limited' | 'validation_error')}
                    className="p-2 border border-gray-300 rounded text-xs bg-white text-gray-700 font-mono"
                 >
                     <option value="happy_path">Happy Path</option>
                     <option value="flaky_inputs">Flaky Inputs</option>
                     <option value="rate_limited">Rate Limited</option>
                     <option value="validation_error">Validation Error</option>
                 </select>

                <button
                    onClick={handleGenerateTranscript}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-sm active:transform active:scale-95 transition-all flex items-center gap-2"
                >
                    {currentTranscript ? 'Rerun Scenario' : 'Generate Transcript'}
                </button>
            </div>
          </div>

           {/* Error Display */}
           {error && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
               <div className="flex items-start gap-2">
                 <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <div className="flex-1">
                   <h3 className="font-semibold text-red-900 text-sm mb-1">Action Blocked</h3>
                   <p className="text-red-700 text-sm">{error}</p>
                 </div>
                 <button 
                   onClick={() => setError(null)}
                   className="text-red-400 hover:text-red-600"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
           )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{run.plan.objective}</h1>
          <p className="text-gray-500 text-sm mb-4">
            Derived from Proposal:{' '}
            <Link href={`/artifacts/${run.proposal_id}`} className="text-blue-600 hover:underline">
              {proposal?.proposal.title || run.proposal_id}
            </Link>
          </p>

          {/* Attempt History & Diff Toggle */}
          {allTranscripts.length > 0 && (
             <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">View Attempt:</label>
                    <select 
                        value={currentTranscript?.transcript_id || ''}
                        onChange={(e) => {
                            setSelectedAttemptId(e.target.value);
                            setDiffMode(false);
                        }}
                        className="p-1 border border-gray-300 rounded text-xs text-gray-600 bg-white"
                    >
                        {allTranscripts.map(t => (
                            <option key={t.transcript_id} value={t.transcript_id}>
                                Attempt #{t.attempt} ({t.scenario_id}) - {new Date(t.created_at).toLocaleTimeString()}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={diffMode}
                            onChange={(e) => setDiffMode(e.target.checked)}
                            className="rounded text-blue-600"
                        />
                        <span className="text-xs font-bold text-gray-500 uppercase">Diff Mode</span>
                    </label>
                    {diffMode && (
                         <select 
                            value={diffTargetId || ''}
                            onChange={(e) => setDiffTargetId(e.target.value)}
                            className="p-1 border border-gray-300 rounded text-xs text-gray-600 bg-white"
                        >
                            <option value="">Select Comparison...</option>
                            {allTranscripts.filter(t => t.transcript_id !== currentTranscript?.transcript_id).map(t => (
                                <option key={t.transcript_id} value={t.transcript_id}>
                                    Compare: Attempt #{t.attempt}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
             </div>
          )}
        </div>

        {currentTranscript ? (
          <div className="flex flex-col h-[600px]">
            <div className="p-4 bg-gray-900 text-gray-400 text-xs font-mono flex items-center justify-between border-b border-gray-800">
              <span>
                  TRANSCRIPT_ID: {currentTranscript.transcript_id} 
                  <span className="text-gray-600 ml-2">| SCENARIO: {currentTranscript.scenario_id}</span>
                  <span className="text-gray-600 ml-2">| ATTEMPT: {currentTranscript.attempt}</span>
              </span>
              <button 
                onClick={handleCopyTranscript}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {copiedTranscript ? 'COPIED' : 'COPY LOG'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-950 p-6 space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              
              {diffMode && diffTargetTranscript && getDiffSummary()}

              {currentTranscript.events.map((event, i) => (
                <div key={i} className="font-mono text-xs flex gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
                  <span className="text-gray-500 whitespace-nowrap min-w-[140px]">
                    {new Date(event.ts).toISOString().split('T')[1].replace('Z', '')}
                  </span>
                  <span className={`uppercase font-bold whitespace-nowrap min-w-[60px] ${
                    event.level === 'error' ? 'text-red-500' :
                    event.level === 'warn' ? 'text-amber-500' :
                    'text-blue-500'
                  }`}>
                    [{event.level}]
                  </span>
                  <span className="text-gray-300">
                    {event.message}
                  </span>
                </div>
              ))}
              <div className="pt-4 text-green-500 font-mono text-xs animate-pulse">
                _ END OF TRANSCRIPT
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-10">
            {/* Execution Steps */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs">01</span>
                Execution Steps
              </h3>
              <div className="space-y-4 relative pl-3">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
                {run.plan.steps.map((step, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-[-16.5px] top-1.5 w-2 h-2 rounded-full bg-white border-2 border-blue-600"></div>
                    <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Inputs & Outputs */}
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inputs Needed</h4>
                <ul className="space-y-2">
                  {run.plan.inputs_needed.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-green-600">Expected Outputs</h4>
                <ul className="space-y-2">
                  {run.plan.expected_outputs.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1 h-1 bg-green-300 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Risks & Rollback */}
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Risks</h4>
                <ul className="space-y-2">
                  {run.plan.risks.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1">⚠️</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Rollback Procedure</h4>
                <ul className="space-y-2">
                  {run.plan.rollback.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1">🔄</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          </div>
        )}

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>Created: {new Date(run.created_at).toLocaleString()}</span>
          <span>Status: {currentTranscript ? 'SIMULATION COMPLETE' : 'DETERMINISTIC PLAN'}</span>
        </div>
      </div>
    </div>
  );
}

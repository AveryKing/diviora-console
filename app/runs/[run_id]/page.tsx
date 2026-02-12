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

  // Safely find run and related data
  const run = state.runs.find(r => r.run_id === run_id);
  const proposal = run ? state.proposals.find(p => p.proposal_id === run.proposal_id) : null;
  const transcript = run ? state.transcripts.find(t => t.run_id === run.run_id) : null;
  const { generateTranscript } = useStore();

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

  const handleGenerateTranscript = () => {
    generateTranscript(run.run_id);
  };

  const handleCopyTranscript = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(JSON.stringify(transcript, null, 2));
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(run, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                transcript ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {transcript ? 'Executed' : run.status}
              </span>
              <span className="text-gray-400 text-sm font-mono">
                {run.run_id}
              </span>
            </div>
            {!transcript && (
              <button
                onClick={handleGenerateTranscript}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-sm active:transform active:scale-95 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generate Transcript
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{run.plan.objective}</h1>
          <p className="text-gray-500 text-sm">
            Derived from Proposal:{' '}
            <Link href={`/artifacts/${run.proposal_id}`} className="text-blue-600 hover:underline">
              {proposal?.proposal.title || run.proposal_id}
            </Link>
          </p>
        </div>

        {transcript ? (
          <div className="flex flex-col h-[600px]">
            <div className="p-4 bg-gray-900 text-gray-400 text-xs font-mono flex items-center justify-between border-b border-gray-800">
              <span>TRANSCRIPT_ID: {transcript.transcript_id}</span>
              <button 
                onClick={handleCopyTranscript}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {copiedTranscript ? 'COPIED' : 'COPY LOG'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-950 p-6 space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {transcript.events.map((event, i) => (
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
          <span>Status: {transcript ? 'SIMULATION COMPLETE' : 'DETERMINISTIC PLAN'}</span>
        </div>
      </div>
    </div>
  );
}

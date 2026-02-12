'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '../../../lib/store';
import EmptyState from '../../components/EmptyState';
import Link from 'next/link';
import { useState } from 'react';
import { Decision } from '../../../lib/types';

export default function ArtifactDetailPage() {
  const { proposal_id } = useParams();
  const { state, setDecision, createRunPlan } = useStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const proposal = state.proposals.find(p => p.proposal_id === proposal_id);
  const decision = state.decisions.find(d => d.proposal_id === proposal_id);
  const run = state.runs.find(r => r.proposal_id === proposal_id);

  if (!state.isLoaded) {
    return <div className="animate-pulse flex space-y-4 flex-col">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="h-96 bg-gray-100 rounded-xl"></div>
    </div>;
  }

  if (!proposal) {
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
          title="Proposal Not Found"
          description={`We couldn't find a proposal with ID "${proposal_id}". It may have been cleared or doesn't exist.`}
        />
        <div className="flex justify-center">
          <Link href="/artifacts" className="text-blue-600 hover:underline">
            View all artifacts
          </Link>
        </div>
      </div>
    );
  }

  const handleDecision = (status: 'approved' | 'rejected') => {
    const newDecision: Decision = {
      decision_id: `dec_${Math.random().toString(36).substr(2, 9)}`,
      proposal_id: proposal.proposal_id,
      status,
      decided_at: new Date().toISOString(),
      note: note.trim() || undefined
    };
    setDecision(newDecision);
    setNote('');
  };

  const handleCreateRun = () => {
    try {
      const newRun = createRunPlan(proposal.proposal_id);
      router.push(`/runs/${newRun.run_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create run plan");
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(proposal, null, 2));
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
          Back to Artifacts
        </button>
        <div className="flex gap-2">
          {run ? (
            <Link 
              href={`/runs/${run.run_id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              View Run Plan
            </Link>
          ) : (
            <button
              onClick={handleCreateRun}
              disabled={decision?.status !== 'approved'}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                decision?.status === 'approved' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={decision?.status !== 'approved' ? 'Requires approval' : 'Generate execution plan'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Create Run Plan
            </button>
          )}
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Draft Proposal
              </span>
              <span className="text-gray-400 text-sm font-mono">
                {proposal.proposal_id}
              </span>
            </div>
            {decision && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                decision.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {decision.status === 'approved' ? '✓' : '✗'} {decision.status}
                <span className="text-[10px] opacity-60 ml-2 normal-case font-medium">
                  {new Date(decision.decided_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{proposal.proposal.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed">{proposal.proposal.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100">
          <div className="p-8 md:border-r border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Next Actions</h3>
            <ul className="space-y-3">
              {proposal.proposal.next_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 bg-amber-50/30">
            <h3 className="text-sm font-bold text-amber-600/70 uppercase tracking-wider mb-4">Risks & Considerations</h3>
            <ul className="space-y-3">
              {proposal.proposal.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-1 text-amber-500 flex-shrink-0">⚠️</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Make a Decision</h3>
          <div className="max-w-xl">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note (Optional)</label>
            <textarea
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-4"
              rows={3}
              placeholder="Add reasoning for your decision..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {decision?.note && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800 italic">
                Latest note: &quot;{decision.note}&quot;
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => handleDecision('approved')}
                disabled={decision?.status === 'approved'}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md active:transform active:scale-95 ${
                  decision?.status === 'approved' 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                }`}
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision('rejected')}
                disabled={decision?.status === 'rejected'}
                className={`flex-1 py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md active:transform active:scale-95 ${
                  decision?.status === 'rejected' 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                }`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Original Input</h3>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-600 text-sm whitespace-pre-wrap italic">
            &quot;{proposal.input.message}&quot;
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-400">
              Compiled on {new Date(proposal.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

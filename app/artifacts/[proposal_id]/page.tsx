'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '../../../lib/store';
import EmptyState from '../../components/EmptyState';
import Link from 'next/link';
import { ProposalRenderer } from '../../components/ProposalRenderer';
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
    try {
      const newDecision: Decision = {
        decision_id: `dec_${Math.random().toString(36).substr(2, 9)}`,
        proposal_id: proposal.proposal_id,
        status,
        decided_at: new Date().toISOString(),
        note: note.trim() || undefined
      };
      setDecision(newDecision);
      setNote('');
      setError(null);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'PolicyError') {
        const policyErr = err as unknown as { decision: { reasons: string[]; policy_ids: string[] } };
        setError(`Policy Violation: ${policyErr.decision.reasons.join('; ')} (${policyErr.decision.policy_ids.join(', ')})`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to set decision');
      }
    }
  };

  const handleCreateRun = () => {
    try {
      const newRun = createRunPlan(proposal.proposal_id);
      setError(null);
      router.push(`/runs/${newRun.run_id}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'PolicyError') {
        const policyErr = err as unknown as { decision: { reasons: string[]; policy_ids: string[] } };
        setError(`Policy Violation: ${policyErr.decision.reasons.join('; ')} (${policyErr.decision.policy_ids.join(', ')})`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to create run plan");
      }
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
              data-testid="create-run-plan"
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
        <ProposalRenderer proposal={proposal} />

        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Make a Decision</h3>
          <div className="max-w-xl">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Note (Optional)</label>
            <textarea
              className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-4"
              rows={3}
              placeholder="Add reasoning for your decision..."
              data-testid="decision-note"
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
                data-testid="approve-button"
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

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import EmptyState from '@/app/components/EmptyState';
import Link from 'next/link';
import { useState } from 'react';

export default function ArtifactDetailPage() {
  const { proposal_id } = useParams();
  const { state } = useStore();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const proposal = state.proposals.find(p => p.proposal_id === proposal_id);

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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy JSON
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Draft Proposal
            </span>
            <span className="text-gray-400 text-sm font-mono">
              {proposal.proposal_id}
            </span>
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

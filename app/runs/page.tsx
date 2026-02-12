'use client';

import EmptyState from "../components/EmptyState";
import { useStore } from "../../lib/store";
import Link from "next/link";

export default function RunsPage() {
  const { state } = useStore();
  const { runs, proposals, isLoaded } = state;

  if (!isLoaded) {
    return <div className="animate-pulse flex space-y-4 flex-col">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="h-64 bg-gray-100 rounded-xl"></div>
    </div>;
  }

  if (runs.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Runs</h2>
        <EmptyState
          title="No Run Plans"
          description="Create a run plan from an approved proposal to see it here. Execution steps will be mapped automatically."
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Runs</h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Run ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {runs.map((run) => {
                const proposal = proposals.find(p => p.proposal_id === run.proposal_id);
                return (
                  <tr key={run.run_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-mono font-bold text-gray-600">
                        {run.run_id.substring(0, 10)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/artifacts/${run.proposal_id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {proposal?.proposal.title || run.proposal_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {state.transcripts.find(t => t.run_id === run.run_id) ? (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-green-50 text-green-600 tracking-wider">
                          Executed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-50 text-blue-600 tracking-wider">
                          {run.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/runs/${run.run_id}`} className="text-blue-600 hover:text-blue-900 group flex items-center justify-end gap-1">
                        View Plan
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

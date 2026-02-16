'use client';

import { Proposal } from '../../lib/types';
import Link from 'next/link';

interface ProposalRendererProps {
  proposal: Proposal;
  isLatest?: boolean; // If true, we show previews/previews for Home page
  showActions?: boolean;
  density?: 'default' | 'dense';
}

export function ProposalRenderer({ proposal, isLatest = false, density = 'default' }: ProposalRendererProps) {
  const { proposal: data, proposal_id, created_at } = proposal;
  const hasSections = data.sections && data.sections.length > 0;
  const isDense = density === 'dense';

  return (
    <div className="flex-1 space-y-4">
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className={`${isLatest ? 'text-xl' : isDense ? 'text-xl' : 'text-3xl'} font-bold text-gray-900 flex-1`}>
            {data.title}
          </h3>
          {data.template_id && (
            <span data-testid="proposal-template-badge" className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {data.template_id.replace('_', ' ')}
            </span>
          )}
        </div>
        {!hasSections && (
          <p className="text-gray-600 leading-relaxed text-sm">
            {data.summary}
          </p>
        )}
      </div>

      {hasSections ? (
        <div data-testid="proposal-sections" className={isLatest ? "space-y-6" : "divide-y divide-gray-100 border-b border-gray-100"}>
          {data.sections!.map((section) => (
            <div
              key={section.key}
              data-testid={`section-${section.key}`}
              className={isLatest ? "space-y-2" : isDense ? "p-4" : "p-8"}
            >
              <h4 data-testid="section-title" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h4>
              {Array.isArray(section.content) ? (
                <ul className="space-y-2">
                  {(isLatest ? section.content.slice(0, 3) : section.content).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className={isLatest ? "line-clamp-2" : ""}>
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </span>
                    </li>
                  ))}
                  {isLatest && section.content.length > 3 && (
                    <li className="text-[10px] text-gray-400 italic pl-5">
                      + {section.content.length - 3} more items...
                    </li>
                  )}
                </ul>
              ) : typeof section.content === 'string' ? (
                <p className={`text-sm text-gray-700 leading-relaxed ${isLatest ? 'line-clamp-3' : 'whitespace-pre-wrap'}`}>
                  {section.content}
                </p>
              ) : (
                <pre className="text-[10px] bg-gray-50 p-2 rounded overflow-x-auto font-mono text-gray-600">
                  {JSON.stringify(section.content, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {isLatest && (
            <div className="pt-2">
              <Link
                href={`/artifacts/${proposal_id}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
              >
                View Full Detailed Artifact
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className={isLatest ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100"}>
          <div className={isLatest ? "" : "p-8 md:border-r border-gray-100"}>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Next Actions</h4>
            <ul className="space-y-2">
              {data.next_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className={isLatest ? "text-blue-500 mt-1" : "w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold"}>
                    {isLatest ? '•' : i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <div className={isLatest ? "" : "p-8 bg-amber-50/30"}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLatest ? 'text-amber-600' : 'text-amber-600/70'}`}>
              Risks
            </h4>
            <ul className="space-y-2">
              {data.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-500 mt-1">⚠️</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div
        className={`pt-4 mt-auto border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 ${
          !isLatest && (isDense ? 'px-4 pb-3' : 'px-8 pb-4')
        }`}
      >
        <span>Created: {new Date(created_at).toLocaleString()}</span>
        <span className="font-mono bg-gray-50 px-2 py-0.5 rounded italic">
          ID: {isLatest ? proposal_id.substring(0, 12) : proposal_id}
        </span>
      </div>
    </div>
  );
}

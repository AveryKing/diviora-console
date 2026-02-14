import { useStore } from '../../../lib/store';
import { TemplateChecklist } from '../TemplateChecklist';
import Link from 'next/link';

export function ContextPanel() {
  const { state } = useStore();
  const latestProposal = state.proposals[0] || null;
  const latestDecision = latestProposal ? state.decisions.find(d => d.proposal_id === latestProposal.proposal_id) : null;
  const latestRun = state.runs[0] || null;

  return (
    <div data-testid="home-context-panel" className="h-full flex flex-col gap-6 p-4">
      {/* Settings Summary */}
      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Context & Settings</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="block text-gray-400">Template</span>
            <span className="font-mono">{state.settings.template_id}</span>
          </div>
          <div>
            <span className="block text-gray-400">Style</span>
            <span className="font-mono">{state.settings.proposal_style}</span>
          </div>
          <div>
            <span className="block text-gray-400">Steps</span>
            <span className="font-mono">{state.settings.default_step_count}</span>
          </div>
          <div>
             <span className="block text-gray-400">Risk</span>
             <span className={`font-mono font-bold ${
                state.settings.risk_level === 'high' ? 'text-red-600' : 
                state.settings.risk_level === 'medium' ? 'text-yellow-600' : 'text-green-600'
             }`}>
                {state.settings.risk_level.toUpperCase()}
             </span>
          </div>
        </div>
      </section>

      {/* Template Checklist */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto">
             <TemplateChecklist 
                templateId={state.settings.template_id} 
                proposal={latestProposal} 
             />
        </div>
      </section>

      {/* Latest Artifacts */}
      <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Latest Artifacts</h3>
        
        {latestProposal ? (
          <Link 
            href={`/proposal/${latestProposal.proposal_id}`} 
            data-testid="latest-proposal-link"
            className="block p-3 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition group"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase">PROPOSAL</span>
              {latestDecision && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                  latestDecision.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {latestDecision.status}
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-800">
              {latestProposal.proposal.title}
            </div>
            <div className="text-[10px] text-gray-400 mt-1 font-mono">
              {new Date(latestProposal.created_at).toLocaleTimeString()}
            </div>
          </Link>
        ) : (
          <div className="text-center py-4 text-gray-400 text-xs italic">No proposals yet</div>
        )}

        {latestRun && (
           <Link href={`/run/${latestRun.run_id}`} className="block p-3 bg-purple-50 border border-purple-100 rounded hover:bg-purple-100 transition group">
             <div className="flex justify-between items-start mb-1">
               <span className="text-[10px] font-bold text-purple-600 uppercase">RUN PLAN</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-gray-200 text-gray-700">
                  {latestRun.status}
                </span>
             </div>
             <div className="text-xs font-medium text-gray-900 truncate group-hover:text-purple-800">
               {latestRun.plan.objective}
             </div>
           </Link>
        )}
      </section>
    </div>
  );
}

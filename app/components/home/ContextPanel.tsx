import { useStore } from '../../../lib/store';
import { useSessionStore } from '../../../lib/session_store';
import { TemplateChecklist } from '../TemplateChecklist';
import Link from 'next/link';
import { Pin, PinOff } from 'lucide-react';

export function ContextPanel() {
  const { state } = useStore();
  const sessionStore = useSessionStore();
  
  const currentSessionId = sessionStore.currentSessionId;
  const currentSession = sessionStore.sessions.find(s => s.session_id === currentSessionId);
  const pinned = currentSession?.pinned || {};

  const latestProposal = state.proposals[0] || null;
  const latestRun = state.runs[0] || null;

  // Find latest decision for proposal
  const latestDecision = latestProposal 
    ? state.decisions.find(d => d.proposal_id === latestProposal.proposal_id) 
    : null;

  const togglePinProposal = (propId: string) => {
    if (!currentSessionId) return;
    const isPinned = pinned.proposal_id === propId;
    sessionStore.actions.pinContext(currentSessionId, {
      ...pinned,
      proposal_id: isPinned ? undefined : propId
    });
  };

  const togglePinRun = (runId: string) => {
    if (!currentSessionId) return;
    const isPinned = pinned.run_id === runId;
    sessionStore.actions.pinContext(currentSessionId, {
      ...pinned,
      run_id: isPinned ? undefined : runId
    });
  };

  return (
    <div data-testid="home-context-panel" className="h-full flex flex-col gap-6 p-4">
      {/* Pinned Context Section */}
      {(pinned.proposal_id || pinned.run_id) && (
        <section className="bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm space-y-2">
             <div className="flex items-center gap-2">
                <Pin size={12} className="text-amber-600" />
                <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Pinned Context</h3>
             </div>
             
             {pinned.proposal_id && latestProposal && pinned.proposal_id === latestProposal.proposal_id && (
                 <div className="flex justify-between items-center text-xs bg-white/50 p-1.5 rounded border border-amber-100">
                    <span className="text-amber-900 truncate font-medium flex-1 mr-2" title={latestProposal.proposal.title}>
                        Prop: {latestProposal.proposal.title}
                    </span>
                    <button 
                        onClick={() => togglePinProposal(pinned.proposal_id!)} 
                        className="text-amber-500 hover:text-amber-800 p-1"
                    >
                        <PinOff size={11} />
                    </button>
                 </div>
             )}
             {/* Note: If pinned proposal is NOT the latest, we might not have its title easily in this simple view unless we search all proposals. 
                 For MVP, we only show details if it matches latest or generic "Pinned Proposal". 
                 But let's attempt to find it if possible, or just show ID. */}
             {pinned.proposal_id && (!latestProposal || pinned.proposal_id !== latestProposal.proposal_id) && (
                 <div className="flex justify-between items-center text-xs bg-white/50 p-1.5 rounded border border-amber-100">
                     <span className="text-amber-900 font-mono text-[10px]">Prop: {pinned.proposal_id.slice(0,8)}...</span>
                     <button onClick={() => togglePinProposal(pinned.proposal_id!)} className="text-amber-500 hover:text-amber-800 p-1"><PinOff size={11} /></button>
                 </div>
             )}

              {pinned.run_id && latestRun && pinned.run_id === latestRun.run_id && (
                 <div className="flex justify-between items-center text-xs bg-white/50 p-1.5 rounded border border-amber-100">
                    <span className="text-amber-900 truncate font-medium flex-1 mr-2" title={latestRun.plan.objective}>
                        Run: {latestRun.plan.objective}
                    </span>
                    <button 
                        onClick={() => togglePinRun(pinned.run_id!)} 
                        className="text-amber-500 hover:text-amber-800 p-1"
                    >
                        <PinOff size={11} />
                    </button>
                 </div>
             )}
              {pinned.run_id && (!latestRun || pinned.run_id !== latestRun.run_id) && (
                 <div className="flex justify-between items-center text-xs bg-white/50 p-1.5 rounded border border-amber-100">
                    <span className="text-amber-900 font-mono text-[10px]">Run: {pinned.run_id.slice(0,8)}...</span>
                     <button onClick={() => togglePinRun(pinned.run_id!)} className="text-amber-500 hover:text-amber-800 p-1"><PinOff size={11} /></button>
                 </div>
             )}
        </section>
      )}

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
          <div className="relative group">
              <Link 
                href={`/proposal/${latestProposal.proposal_id}`} 
                data-testid="latest-proposal-link"
                className="block p-3 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition mr-8"
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
              {currentSessionId && (
                  <button 
                    data-testid="session-pin-proposal"
                    onClick={(e) => { e.preventDefault(); togglePinProposal(latestProposal.proposal_id); }}
                    title={pinned.proposal_id === latestProposal.proposal_id ? "Unpin details" : "Pin to Session"}
                    className={`absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-full transition ${
                        pinned.proposal_id === latestProposal.proposal_id 
                        ? 'bg-amber-100 text-amber-600 shadow-inner' 
                        : 'text-gray-300 hover:text-blue-600 hover:bg-white'
                    }`}
                  >
                     {pinned.proposal_id === latestProposal.proposal_id ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
              )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400 text-xs italic">No proposals yet</div>
        )}

        {latestRun && (
           <div className="relative group">
               <Link href={`/run/${latestRun.run_id}`} className="block p-3 bg-purple-50 border border-purple-100 rounded hover:bg-purple-100 transition mr-8">
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
               {currentSessionId && (
                  <button 
                    data-testid="session-pin-run"
                    onClick={(e) => { e.preventDefault(); togglePinRun(latestRun.run_id); }}
                    title={pinned.run_id === latestRun.run_id ? "Unpin details" : "Pin to Session"}
                    className={`absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-full transition ${
                        pinned.run_id === latestRun.run_id 
                        ? 'bg-amber-100 text-amber-600 shadow-inner' 
                        : 'text-gray-300 hover:text-purple-600 hover:bg-white'
                    }`}
                  >
                     {pinned.run_id === latestRun.run_id ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
              )}
           </div>
        )}
      </section>
    </div>
  );
}

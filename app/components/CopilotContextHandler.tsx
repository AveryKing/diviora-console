'use client';

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useStore } from "@/lib/store";
import { usePathname, useParams } from "next/navigation";

export function CopilotContextHandler() {
  const { state } = useStore();
  const pathname = usePathname();
  const params = useParams();

  // 1. Inject Settings Context
  useCopilotReadable({
    description: "Current application settings",
    value: state.settings,
  });

  // 2. Inject Latest Proposal Context
  const latestProposal = state.proposals[0];
  const latestProposalContext = latestProposal ? {
    proposal_id: latestProposal.proposal_id,
    template_id: latestProposal.proposal.template_id,
    title: latestProposal.proposal.title,
    summary: latestProposal.proposal.summary.substring(0, 500),
    risks: latestProposal.proposal.risks,
    next_actions: latestProposal.proposal.next_actions,
    sections: latestProposal.proposal.sections?.map(s => ({
      title: s.title,
      content: typeof s.content === 'string' ? s.content.substring(0, 500) : s.content.slice(0, 3)
    }))
  } : null;

  useCopilotReadable({
    description: "The latest draft proposal",
    value: latestProposalContext,
  });

  // 3. Page specific context
  const isArtifactPage = pathname.includes('/artifacts/') && params.proposal_id;
  const selectedProposal = isArtifactPage 
    ? state.proposals.find(p => p.proposal_id === params.proposal_id)
    : null;

  useCopilotReadable({
    description: "The currently viewed artifact detail",
    value: selectedProposal ? {
      proposal_id: selectedProposal.proposal_id,
      title: selectedProposal.proposal.title,
      summary: selectedProposal.proposal.summary.substring(0, 500),
    } : null
  });

  const isRunPage = pathname.includes('/runs/') && params.run_id;
  const selectedRun = isRunPage
    ? state.runs.find(r => r.run_id === params.run_id)
    : null;

  useCopilotReadable({
    description: "The currently viewed run plan detail",
    value: selectedRun
  });

  // 4. Draft Input Action
  useCopilotAction({
    name: "draftNextMessage",
    description: "Drafts a suggested next message for the user based on the current context.",
    parameters: [
      {
        name: "draft",
        type: "string",
        description: "The suggested draft message.",
        required: true,
      },
    ],
    handler: async ({ draft }) => {
      // We broadcast the draft so the UI can catch it
      window.dispatchEvent(new CustomEvent('diviora:copilot-draft', { detail: { draft } }));
    },
  });

  return null;
}



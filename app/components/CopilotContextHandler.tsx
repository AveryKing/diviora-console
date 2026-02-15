'use client';

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useStore } from "@/lib/store";
import { usePathname, useParams } from "next/navigation";
import { draftPromptSchema, bugTriageFieldsSchema, missingFieldsSchema } from "@/lib/copilot_actions_schema";

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

  // 4. Structured Actions
  
  // A) draft_prompt_for_template
  useCopilotAction({
    name: "draft_prompt_for_template",
    description: "Generates a refined starting prompt for a specific template based on raw user input.",
    parameters: [
      { name: "draft", type: "string", description: "The refined text for the composer.", required: true },
    ],
    handler: async ({ draft }) => {
      const result = draftPromptSchema.safeParse({ draft });
      if (!result.success) throw new Error("Invalid draft prompt output");
      
      window.dispatchEvent(new CustomEvent('diviora:copilot-draft', { 
        detail: { draft: result.data.draft, source: 'template_draft' } 
      }));
    },
  });

  // B) extract_bug_triage_fields
  useCopilotAction({
    name: "extract_bug_triage_fields",
    description: "Extracts structured bug report fields from a text block.",
    parameters: [
      { name: "title", type: "string", required: true },
      { name: "severity", type: "string", required: true },
      { name: "component", type: "string", required: true },
      { name: "description", type: "string", required: true },
      { name: "repro_steps", type: "string" },
      { name: "expected_behavior", type: "string" },
      { name: "actual_result", type: "string" },
    ],
    handler: async (fields) => {
      const result = bugTriageFieldsSchema.safeParse(fields);
      if (!result.success) throw new Error("Invalid bug triage fields extracted");

      window.dispatchEvent(new CustomEvent('diviora:copilot-extraction', { 
        detail: { fields: result.data, template: 'bug_triage' } 
      }));
    },
  });

  // C) suggest_missing_fields
  useCopilotAction({
    name: "suggest_missing_fields",
    description: "Suggests missing fields or sections for the current proposal.",
    parameters: [
      { name: "missing", type: "string[]", required: true },
      { name: "hints", type: "string[]", required: true },
    ],
    handler: async (data) => {
      const result = missingFieldsSchema.safeParse(data);
      if (!result.success) throw new Error("Invalid missing fields suggestion");

      window.dispatchEvent(new CustomEvent('diviora:copilot-hints', { 
        detail: { missing: result.data.missing, hints: result.data.hints } 
      }));
    },
  });

  // Legacy/Default Draft Action
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
      window.dispatchEvent(new CustomEvent('diviora:copilot-draft', { detail: { draft } }));
    },
  });

  return null;
}

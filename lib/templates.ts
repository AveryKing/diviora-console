import { ProposalSection, Settings } from './types';

export type TemplateId = 'generic' | 'sales_outreach' | 'bug_triage' | 'project_plan';

export const TEMPLATE_REGISTRY: Record<TemplateId, { title: string; description: string }> = {
  generic: { title: 'Generic Proposal', description: 'Standard format with summary, actions, and risks.' },
  sales_outreach: { title: 'Sales Outreach', description: 'Structured for ICP, offer, and sequence.' },
  bug_triage: { title: 'Bug Triage', description: 'Repro steps, expected behavior, and fix plan.' },
  project_plan: { title: 'Project Plan', description: 'Goals, milestones, and dependencies.' },
};

export function generateProposalSections(
  templateId: TemplateId,
  message: string,
  settings: Settings
): ProposalSection[] {
  const isConcise = settings.proposal_style === 'concise';
  const stepCount = settings.default_step_count;
  const riskLevel = settings.risk_level;

  const sections: ProposalSection[] = [];

  // Helper to generate deterministic list items
  const generateList = (prefix: string, count: number) => 
    Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}: Based on input "${message.substring(0, 15)}..."`);

  switch (templateId) {
    case 'sales_outreach':
      sections.push({
        key: 'icp',
        title: 'Ideal Customer Profile (ICP)',
        content: isConcise 
          ? `Targeting decision makers in sector related to: ${message}`
          : `Primary persona: VP of Engineering or CTO. \nCompany size: 50-500 employees. \nSector: Technology/SaaS. \nContext: ${message}`,
      });
      sections.push({
        key: 'offer',
        title: 'Core Offer',
        content: `Value proposition aligned with "${message}". We solve the connectivity problem with zero-uptime integration.`,
      });
      sections.push({
        key: 'sequence',
        title: 'Sequence Steps',
        content: generateList('Email Touchpoint', stepCount),
      });
      sections.push({
        key: 'objections',
        title: 'Handled Objections',
        content: isConcise
          ? ["Budget constraints", "Timing"]
          : ["Budget: emphasize ROI", "Timing: emphasize Q3 goals", "Competitor lock-in: emphasize ease of switch"],
      });
      break;

    case 'bug_triage':
      sections.push({
        key: 'repro_steps',
        title: 'Reproduction Steps',
        content: generateList('Action', stepCount),
      });
      sections.push({
        key: 'expected_actual',
        title: 'Expected vs Actual',
        content: `Expected: System processes "${message}" without error. \nActual: Error thrown during processing.`,
      });
      sections.push({
        key: 'suspected_cause',
        title: 'Suspected Cause',
        content: isConcise ? "Input validation failure." : "Race condition in message processing pipeline triggered by specific input length or characters.",
      });
      sections.push({
        key: 'fix_plan',
        title: 'Fix Plan',
        content: ["Isolate component", "Write test case", "Apply patch", "Verify"],
      });
      break;

    case 'project_plan':
      sections.push({
        key: 'goal',
        title: 'Project Goal',
        content: `Deliverable: Complete implementation of requirements described in "${message}".`,
      });
      sections.push({
        key: 'milestones',
        title: 'Key Milestones',
        content: generateList('Milestone', stepCount),
      });
      sections.push({
        key: 'dependencies',
        title: 'Dependencies',
        content: isConcise 
          ? ["Internal API", "Design constraints"]
          : ["Internal User API v2 availability", "Design system freeze", "Stakeholder sign-off", "Infrastructure scaling"],
      });
      sections.push({
        key: 'test_plan',
        title: 'Test Plan',
        content: "Unit tests > Integration tests > UAT.",
      });
      break;

    case 'generic':
    default:
      sections.push({
        key: 'summary',
        title: 'Executive Summary',
        content: isConcise 
          ? `Brief overview: ${message.substring(0, 100)}`
          : `Comprehensive analysis of "${message}". This proposal outlines the necessary steps, risks, and expected outcomes to achieve the stated objective.`,
      });
      sections.push({
        key: 'next_actions',
        title: 'Next Actions',
        content: generateList('Step', stepCount),
      });
      break;
  }

  // Common Risks section for all templates
  const baseRisks = ["Resource availability"];
  if (riskLevel === 'medium') baseRisks.push("Scope creep", "Timeline slippage");
  if (riskLevel === 'high') baseRisks.push("Technical debt accumulation", "Security compliance", "Data loss potential");
  
  sections.push({
    key: 'risks',
    title: 'Risk Assessment',
    content: baseRisks,
  });

  return sections;
}

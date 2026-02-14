import { Proposal } from './types';

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
  helperText: string;
}

export function getTemplateChecklist(templateId: string | undefined, proposal: Proposal | null): ChecklistItem[] {
  if (templateId !== 'bug_triage') {
    return []; // Coming soon for others
  }

  const items: ChecklistItem[] = [
    {
      id: 'repro_steps',
      label: 'Reproduction Steps',
      isCompleted: false,
      helperText: 'Add steps to reproduce the issue.',
    },
    {
      id: 'expected_actual',
      label: 'Expected vs Actual',
      isCompleted: false,
      helperText: 'Describe what happened vs what should happen.',
    },
    {
      id: 'suspected_cause',
      label: 'Suspected Cause',
      isCompleted: false,
      helperText: 'Identify the likely root cause.',
    },
    {
      id: 'fix_plan',
      label: 'Fix Plan',
      isCompleted: false,
      helperText: 'Outline the intended solution.',
    },
  ];

  if (!proposal) return items;

  const sections = proposal.proposal.sections || [];

  return items.map(item => {
    const section = sections.find(s => s.key === item.id);
    const hasContent = section && (
      (typeof section.content === 'string' && section.content.trim().length > 0) ||
      (Array.isArray(section.content) && section.content.length > 0)
    );

    return {
      ...item,
      isCompleted: !!hasContent,
    };
  });
}

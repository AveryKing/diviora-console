export interface BugTriageFields {
  repro_steps: string;
  expected: string;
  actual: string;
  suspected_cause: string;
  fix_plan: string;
}

export function assembleBugTriagePrompt(fields: BugTriageFields): string {
  return `### Distilled Reproduction Steps
${fields.repro_steps.trim()}

### Expected Outcome
${fields.expected.trim()}

### Actual Outcome
${fields.actual.trim()}

### Suspected Cause
${fields.suspected_cause.trim()}

### Proposed Fix Plan
${fields.fix_plan.trim()}`;
}

export function parseBugTriageFromText(text: string): Partial<BugTriageFields> {
  const fields: Partial<BugTriageFields> = {};

  const reproMatch = text.match(/### Distilled Reproduction Steps\n([\s\S]*?)(?=\n###|$)/i);
  if (reproMatch) fields.repro_steps = reproMatch[1].trim();

  const expectedMatch = text.match(/### Expected Outcome\n([\s\S]*?)(?=\n###|$)/i);
  if (expectedMatch) fields.expected = expectedMatch[1].trim();

  const actualMatch = text.match(/### Actual Outcome\n([\s\S]*?)(?=\n###|$)/i);
  if (actualMatch) fields.actual = actualMatch[1].trim();

  const causeMatch = text.match(/### Suspected Cause\n([\s\S]*?)(?=\n###|$)/i);
  if (causeMatch) fields.suspected_cause = causeMatch[1].trim();

  const fixMatch = text.match(/### Proposed Fix Plan\n([\s\S]*?)(?=\n###|$)/i);
  if (fixMatch) fields.fix_plan = fixMatch[1].trim();

  return fields;
}

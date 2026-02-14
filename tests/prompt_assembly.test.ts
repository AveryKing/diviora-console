import { describe, it, expect } from 'vitest';
import { assembleBugTriagePrompt, parseBugTriageFromText, BugTriageFields } from '../lib/prompt_assembly';

describe('Prompt Assembly', () => {
  it('parses bug triage markdown correctly', () => {
    const markdown = `
### Distilled Reproduction Steps
- Step 1
- Step 2

### Expected Outcome
Expected result

### Actual Outcome
Actual result

### Suspected Cause
The cause

### Proposed Fix Plan
- Fix 1
`;
    const fields = parseBugTriageFromText(markdown);
    
    expect(fields.repro_steps).toBe('- Step 1\n- Step 2');
    expect(fields.expected).toBe('Expected result');
    expect(fields.actual).toBe('Actual result');
    expect(fields.suspected_cause).toBe('The cause');
    expect(fields.fix_plan).toBe('- Fix 1');
  });

  it('assembles bug triage fields into markdown', () => {
    const fields: BugTriageFields = {
      repro_steps: 'Repro',
      expected: 'Exp',
      actual: 'Act',
      suspected_cause: 'Cause',
      fix_plan: 'Fix',
    };

    const assembled = assembleBugTriagePrompt(fields);
    
    expect(assembled).toContain('### Distilled Reproduction Steps\nRepro');
    expect(assembled).toContain('### Expected Outcome\nExp');
  });

  it('handles partial parsing', () => {
    const markdown = `### Distilled Reproduction Steps\nRepro only`;
    const fields = parseBugTriageFromText(markdown);
    expect(fields.repro_steps).toBe('Repro only');
    expect(fields.expected).toBeUndefined();
  });
});

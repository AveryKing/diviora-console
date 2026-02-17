import { describe, it, expect } from 'vitest';
import { ensurePackSections } from '../lib/agent_pack_template';

describe('ensurePackSections', () => {
  it('adds missing required sections deterministically', () => {
    const output = ensurePackSections('## Objective\n- Build feature');
    expect(output).toContain('## Objective');
    expect(output).toContain('## Scope');
    expect(output).toContain('## Acceptance Criteria');
    expect(output).toContain('## Tests');
    expect(output).toContain('## Rollback');
    expect(output).toContain('## Done Criteria');
  });
});

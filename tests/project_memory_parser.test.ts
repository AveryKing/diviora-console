import { describe, it, expect } from 'vitest';
import { parseProjectSnapshotInput } from '../lib/project_memory';

describe('project memory parser', () => {
  it('parses branch/head and gate status from markdown', () => {
    const markdown = [
      '## Repo State',
      'branch: main',
      'head sha: abcdef1234567890',
      '',
      '| Gate | Status |',
      '| ---- | ------ |',
      '| lint | PASS |',
      '| typecheck | FAIL |',
    ].join('\n');

    const parsed = parseProjectSnapshotInput(markdown);
    expect(parsed.branch).toBe('main');
    expect(parsed.head_sha).toBe('abcdef1234567890');
    expect(parsed.parsed_summary.parse_status).toBe('parsed');
    expect(parsed.parsed_summary.gate_statuses).toEqual([
      { gate: 'lint', status: 'PASS' },
      { gate: 'typecheck', status: 'FAIL' },
    ]);
  });

  it('parses branch/head from JSON snapshot style payload', () => {
    const parsed = parseProjectSnapshotInput(
      JSON.stringify({ branch: 'feature/foo', head_sha: '1234567890abcdef', gates: { lint: 'PASS' } })
    );

    expect(parsed.branch).toBe('feature/foo');
    expect(parsed.head_sha).toBe('1234567890abcdef');
    expect(parsed.parsed_summary.parse_status).toBe('parsed');
    expect(parsed.parsed_summary.gate_statuses).toEqual([{ gate: 'lint', status: 'PASS' }]);
  });

  it('marks unparsed when no known structure is present', () => {
    const parsed = parseProjectSnapshotInput('random text with no structured fields');
    expect(parsed.branch).toBeUndefined();
    expect(parsed.head_sha).toBeUndefined();
    expect(parsed.parsed_summary.parse_status).toBe('unparsed');
  });
});

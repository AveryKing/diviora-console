const REQUIRED_SECTIONS = [
  'Objective',
  'Scope',
  'Acceptance Criteria',
  'Tests',
  'Rollback',
  'Done Criteria',
] as const;

function hasHeading(markdown: string, heading: string): boolean {
  const pattern = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, 'im');
  return pattern.test(markdown);
}

export function ensurePackSections(content: string): string {
  let output = content.trim();
  if (!output) {
    output = '# Draft Pack';
  }

  for (const heading of REQUIRED_SECTIONS) {
    if (!hasHeading(output, heading)) {
      output += `\n\n## ${heading}\n- TODO`;
    }
  }

  return output;
}

import { AgentPack } from './types';

const AGENTS_INVARIANTS = [
  'Fail-closed: if evidence is missing or behavior is uncertain, stop and report UNKNOWN.',
  'Keep diffs minimal and scoped to one issue pack; avoid unrelated refactors and lockfile churn unless required.',
  'Never commit secrets or .env* files; use .env.local for local secrets only.',
  'Run gates before marking ready: npm run lint, npm run typecheck, npm run test, npm run build, npm run test:e2e (when UI is touched).',
  'No network access unless required by the task; never write outside the workspace.',
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'issue-pack';
}

function branchSuggestion(pack: AgentPack): string {
  return `codex/${slugify(pack.title)}-${pack.pack_id.slice(-6)}`;
}

function extractSection(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/);
  const target = `## ${heading}`.toLowerCase();
  const start = lines.findIndex((line) => line.trim().toLowerCase() === target);
  if (start < 0) return '';

  const collected: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith('## ')) break;
    collected.push(line);
  }
  return collected.join('\n').trim();
}

function extractChecklist(sectionBody: string): string[] {
  return sectionBody
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^(-\s+|\d+\.\s+)/, '').trim())
    .filter(Boolean);
}

export function generateCodexTaskPacket(pack: AgentPack): string {
  const objective = extractSection(pack.content_markdown, 'Objective') || pack.title;
  const scope = extractSection(pack.content_markdown, 'Scope') || 'Refer to issue pack markdown for implementation scope.';
  const acceptance = extractChecklist(extractSection(pack.content_markdown, 'Acceptance Criteria'));

  const acceptanceChecklist = acceptance.length > 0
    ? acceptance.map((item) => `- [ ] ${item}`).join('\n')
    : '- [ ] Implement the scope in this issue pack without widening scope.';

  return [
    '# CODEX_TASK_PACKET',
    '',
    '## Invariants (from AGENTS.md)',
    ...AGENTS_INVARIANTS.map((item) => `- ${item}`),
    '',
    '## Task',
    `- Pack ID: ${pack.pack_id}`,
    `- Title: ${pack.title}`,
    `- Kind: ${pack.kind}`,
    `- Suggested branch: ${branchSuggestion(pack)}`,
    '',
    '## Objective',
    objective,
    '',
    '## Scope',
    scope,
    '',
    '## Commands',
    '```bash',
    'git fetch origin',
    'git checkout main',
    'git pull --ff-only origin main',
    `git checkout -b ${branchSuggestion(pack)}`,
    'npm ci',
    'npm run lint',
    'npm run typecheck',
    'npm run test',
    'npm run build',
    'npm run test:e2e',
    '```',
    '',
    '## Acceptance Checklist',
    acceptanceChecklist,
    '',
    '## Required Evidence To Paste Back',
    '- `git status --short --branch` after implementation.',
    '- `git diff --stat` for scoped diff proof.',
    '- Gate outputs for lint/typecheck/test/build/test:e2e with PASS/FAIL.',
    '- PR link and CI run link with green status.',
  ].join('\n');
}

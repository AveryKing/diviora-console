import { ProjectSnapshot, ProjectSnapshotSummary } from './types';

const BRANCH_PATTERNS = [
  /\bbranch\s*[:=]\s*([^\n]+)/i,
  /\bgit branch\s*[:=]\s*([^\n]+)/i,
];

const HEAD_SHA_PATTERNS = [
  /\bhead(?:\s+sha)?\s*[:=]\s*([a-f0-9]{7,40})\b/i,
  /\bsha\s*[:=]\s*([a-f0-9]{7,40})\b/i,
];

const REPO_PATTERNS = [
  /\brepo(?:\s+name)?\s*[:=]\s*([^\n]+)/i,
  /\brepository\s*[:=]\s*([^\n]+)/i,
];

const GATE_PATTERN = /^\s*\|?\s*(lint|typecheck|test|build|e2e)\s*\|\s*(PASS|FAIL|UNKNOWN)\s*\|?/i;

function clean(value: string): string {
  return value.trim().replace(/^`|`$/g, '');
}

function parseFirst(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return undefined;
}

function parseGateStatusesFromMarkdown(markdown: string): ProjectSnapshotSummary['gate_statuses'] {
  const lines = markdown.split('\n');
  const parsed = lines
    .map((line) => {
      const match = line.match(GATE_PATTERN);
      if (!match) return null;
      return {
        gate: match[1].toLowerCase(),
        status: match[2].toUpperCase() as 'PASS' | 'FAIL' | 'UNKNOWN',
      };
    })
    .filter((entry): entry is { gate: string; status: 'PASS' | 'FAIL' | 'UNKNOWN' } => entry !== null);

  return parsed.length > 0 ? parsed : undefined;
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function parseJsonSummary(json: Record<string, unknown>): ProjectSnapshotSummary {
  const gateRoot = asRecord(json.gates);
  const summaryRoot = asRecord(json.summary);
  const gateSource = gateRoot ?? summaryRoot;

  const gate_statuses = gateSource
    ? Object.entries(gateSource)
        .filter(([, value]) => typeof value === 'string')
        .map(([gate, value]) => ({
          gate: gate.toLowerCase(),
          status: String(value).toUpperCase(),
        }))
        .filter((entry): entry is { gate: string; status: 'PASS' | 'FAIL' | 'UNKNOWN' } =>
          entry.status === 'PASS' || entry.status === 'FAIL' || entry.status === 'UNKNOWN'
        )
    : undefined;

  if (gate_statuses && gate_statuses.length > 0) {
    return { parse_status: 'parsed', gate_statuses };
  }

  return { parse_status: 'unparsed' };
}

export function parseProjectSnapshotInput(raw: string): {
  branch?: string;
  head_sha?: string;
  repo_name?: string;
  parsed_summary: ProjectSnapshotSummary;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { parsed_summary: { parse_status: 'unparsed' } };
  }

  try {
    const json = JSON.parse(trimmed) as unknown;
    const record = asRecord(json);
    if (record) {
      const branch = typeof record.branch === 'string' ? record.branch : undefined;
      const head_sha = typeof record.head_sha === 'string' ? record.head_sha : typeof record.sha === 'string' ? record.sha : undefined;
      const repo_name = typeof record.repo_name === 'string' ? record.repo_name : typeof record.repository === 'string' ? record.repository : undefined;
      return {
        branch,
        head_sha,
        repo_name,
        parsed_summary: parseJsonSummary(record),
      };
    }
  } catch {
    // non-JSON input -> treat as markdown
  }

  const branch = parseFirst(trimmed, BRANCH_PATTERNS);
  const head_sha = parseFirst(trimmed, HEAD_SHA_PATTERNS);
  const repo_name = parseFirst(trimmed, REPO_PATTERNS);
  const gate_statuses = parseGateStatusesFromMarkdown(trimmed);

  if (branch || head_sha || repo_name || gate_statuses) {
    return {
      branch,
      head_sha,
      repo_name,
      parsed_summary: {
        parse_status: 'parsed',
        gate_statuses,
      },
    };
  }

  return {
    parsed_summary: { parse_status: 'unparsed' },
  };
}

export function buildProjectSnapshot(params: {
  source: ProjectSnapshot['source'];
  raw: string;
}): ProjectSnapshot {
  const parsed = parseProjectSnapshotInput(params.raw);
  return {
    snapshot_id: `ps_${Math.random().toString(36).slice(2, 11)}`,
    created_at: new Date().toISOString(),
    source: params.source,
    repo_name: parsed.repo_name,
    branch: parsed.branch,
    head_sha: parsed.head_sha,
    raw_markdown: params.raw,
    parsed_summary: parsed.parsed_summary,
  };
}

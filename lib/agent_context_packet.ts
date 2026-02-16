import { ProjectSnapshot, Proposal, Settings } from './types';

function latestByCreatedAt<T extends { created_at: string }>(items?: T[]): T | null {
  if (!Array.isArray(items)) return null;
  if (items.length === 0) return null;
  return items.reduce((latest, candidate) => {
    const latestTs = Date.parse(latest.created_at);
    const candidateTs = Date.parse(candidate.created_at);
    if (Number.isNaN(candidateTs)) return latest;
    if (Number.isNaN(latestTs)) return candidate;
    return candidateTs > latestTs ? candidate : latest;
  });
}

export function getLatestProposal(proposals?: Proposal[]): Proposal | null {
  return latestByCreatedAt(proposals);
}

export function getLatestProjectSnapshot(projectSnapshots?: ProjectSnapshot[]): ProjectSnapshot | null {
  return latestByCreatedAt(projectSnapshots);
}

export function buildAgentContextPacket(params: {
  settings: Settings;
  proposals?: Proposal[];
  projectSnapshots?: ProjectSnapshot[];
}) {
  const latestProposal = getLatestProposal(params.proposals);
  const latestSnapshot = getLatestProjectSnapshot(params.projectSnapshots);

  return {
    settings: {
      template_id: params.settings.template_id,
      proposal_style: params.settings.proposal_style,
      risk_level: params.settings.risk_level,
      default_step_count: params.settings.default_step_count,
      timeline_mode: params.settings.timeline_mode,
      agent_view_mode: params.settings.agent_view_mode ?? 'split',
    },
    latestProposal: latestProposal
      ? {
          proposal_id: latestProposal.proposal_id,
          template_id: latestProposal.proposal.template_id ?? null,
          created_at: latestProposal.created_at,
        }
      : null,
    latestProjectSnapshot: latestSnapshot
      ? {
          snapshot_id: latestSnapshot.snapshot_id,
          created_at: latestSnapshot.created_at,
          branch: latestSnapshot.branch ?? null,
          head_sha: latestSnapshot.head_sha ?? null,
          raw_markdown: latestSnapshot.raw_markdown,
        }
      : null,
  };
}

import { AgentPack, DispatchRecord, ProjectSnapshot, Proposal } from './types';
import { canDispatchPack } from './authority_queue_policy';

export type AuthorityItem = {
  item_id: string;
  kind: 'agent_pack';
  status: 'draft' | 'approved' | 'rejected' | 'ready_to_dispatch' | 'dispatched';
  required_action: 'approve' | 'reject' | 'dispatch' | 'none';
  title: string;
  created_at: string;
  refs: { pack_id: string; snapshot_id?: string; proposal_id?: string; dispatch_id?: string };
  blockers: string[];
};

function isDispatchedFromLedger(dispatch?: DispatchRecord): boolean {
  if (!dispatch) return false;
  return ['queued', 'sent', 'acked'].includes(dispatch.status);
}

export function deriveAuthorityItems(
  packs: AgentPack[],
  snapshots: ProjectSnapshot[],
  proposals: Proposal[],
  dispatchRecords: DispatchRecord[]
): AuthorityItem[] {
  const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.snapshot_id));
  const proposalIds = new Set(proposals.map((proposal) => proposal.proposal_id));
  const dispatchById = new Map(dispatchRecords.map((record) => [record.dispatch_id, record]));

  return packs
    .map((pack) => {
      const blockers: string[] = [];
      if (pack.inputs.snapshot_id && !snapshotIds.has(pack.inputs.snapshot_id)) {
        blockers.push(`Missing snapshot reference: ${pack.inputs.snapshot_id}`);
      }
      if (pack.inputs.proposal_id && !proposalIds.has(pack.inputs.proposal_id)) {
        blockers.push(`Missing proposal reference: ${pack.inputs.proposal_id}`);
      }

      const latestDispatch = pack.latest_dispatch_id ? dispatchById.get(pack.latest_dispatch_id) : undefined;
      if (pack.latest_dispatch_id && !latestDispatch) {
        blockers.push(`Missing dispatch reference: ${pack.latest_dispatch_id}`);
      }

      const dispatchDecision = canDispatchPack(pack);
      if (!dispatchDecision.allowed && pack.status === 'approved' && !latestDispatch) {
        blockers.push(dispatchDecision.reason ?? 'Dispatch policy failed.');
      }

      const isReadyToDispatch = pack.status === 'approved' && dispatchDecision.allowed && !latestDispatch;
      const status: AuthorityItem['status'] =
        isDispatchedFromLedger(latestDispatch) ? 'dispatched' : isReadyToDispatch ? 'ready_to_dispatch' : pack.status;

      const required_action: AuthorityItem['required_action'] =
        status === 'draft' ? 'approve' : status === 'ready_to_dispatch' ? 'dispatch' : 'none';

      return {
        item_id: `agent_pack:${pack.pack_id}`,
        kind: 'agent_pack' as const,
        status,
        required_action,
        title: pack.title,
        created_at: pack.created_at,
        refs: {
          pack_id: pack.pack_id,
          snapshot_id: pack.inputs.snapshot_id,
          proposal_id: pack.inputs.proposal_id,
          dispatch_id: latestDispatch?.dispatch_id,
        },
        blockers,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

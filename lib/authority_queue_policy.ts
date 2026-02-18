import { AgentPack } from './types';

export type AuthorityPolicyDecision = {
  allowed: boolean;
  reason?: string;
};

function hasApprovalNote(note?: string): boolean {
  return Boolean(note?.trim());
}

export function canApprovePack(pack: AgentPack, note: string): AuthorityPolicyDecision {
  if (pack.status === 'dispatched' || pack.status === 'rejected') {
    return { allowed: false, reason: `Cannot approve a ${pack.status} pack.` };
  }
  if (!hasApprovalNote(note)) {
    return { allowed: false, reason: 'Approval note is required.' };
  }
  return { allowed: true };
}

export function canRejectPack(pack: AgentPack, note: string): AuthorityPolicyDecision {
  if (pack.status === 'dispatched' || pack.status === 'rejected') {
    return { allowed: false, reason: `Cannot reject a ${pack.status} pack.` };
  }
  if (!hasApprovalNote(note)) {
    return { allowed: false, reason: 'Rejection note is required.' };
  }
  return { allowed: true };
}

export function canDispatchPack(pack: AgentPack): AuthorityPolicyDecision {
  if (pack.status === 'dispatched' || pack.status === 'rejected') {
    return { allowed: false, reason: `Cannot dispatch a ${pack.status} pack.` };
  }
  if (pack.status !== 'approved') {
    return { allowed: false, reason: 'Only approved packs can be dispatched.' };
  }
  if (pack.latest_dispatch_id) {
    return { allowed: false, reason: 'Pack already has an active dispatch record.' };
  }
  if (!hasApprovalNote(pack.approval_note)) {
    return { allowed: false, reason: 'Dispatch requires an approval note.' };
  }
  return { allowed: true };
}

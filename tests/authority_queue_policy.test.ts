import { describe, expect, it } from 'vitest';
import { canApprovePack, canDispatchPack, canRejectPack } from '../lib/authority_queue_policy';
import { deriveAuthorityItems } from '../lib/authority_queue';
import { AgentPack, ProjectSnapshot, Proposal } from '../lib/types';

function basePack(overrides: Partial<AgentPack> = {}): AgentPack {
  return {
    pack_id: 'pack_1',
    created_at: '2026-01-01T00:00:00.000Z',
    kind: 'issue',
    title: 'Pack 1',
    content_markdown: 'content',
    inputs: {},
    status: 'draft',
    ...overrides,
  };
}

describe('authority queue policy', () => {
  it('requires note for approval/rejection', () => {
    const pack = basePack();
    expect(canApprovePack(pack, '').allowed).toBe(false);
    expect(canRejectPack(pack, '   ').allowed).toBe(false);
    expect(canApprovePack(pack, 'looks good').allowed).toBe(true);
  });

  it('requires approved status and approval note for dispatch', () => {
    expect(canDispatchPack(basePack({ status: 'draft' })).allowed).toBe(false);
    expect(canDispatchPack(basePack({ status: 'approved', approval_note: '' })).allowed).toBe(false);
    expect(canDispatchPack(basePack({ status: 'approved', approval_note: 'ship it' })).allowed).toBe(true);
  });

  it('blocks dispatch when dispatch record already exists', () => {
    expect(canDispatchPack(basePack({ status: 'approved', approval_note: 'ship it', latest_dispatch_id: 'disp_1' })).allowed).toBe(false);
  });
});

describe('deriveAuthorityItems', () => {
  it('computes blockers and required_action deterministically', () => {
    const packs: AgentPack[] = [
      basePack({
        pack_id: 'pack_ready',
        status: 'approved',
        approval_note: 'approved with note',
        inputs: { snapshot_id: 'snap_1', proposal_id: 'prop_1' },
      }),
      basePack({
        pack_id: 'pack_blocked',
        status: 'approved',
        approval_note: 'approved with note',
        inputs: { snapshot_id: 'missing_snapshot' },
      }),
      basePack({ pack_id: 'pack_draft', status: 'draft' }),
    ];

    const snapshots: ProjectSnapshot[] = [{
      snapshot_id: 'snap_1',
      created_at: '2026-01-01T00:00:00.000Z',
      source: 'manual_paste',
      raw_markdown: 'x',
    }];

    const proposals: Proposal[] = [{
      proposal_id: 'prop_1',
      created_at: '2026-01-01T00:00:00.000Z',
      input: { message: 'hello' },
      proposal: { title: 'Title', summary: 'Summary', next_actions: [], risks: [] },
    }];

    const items = deriveAuthorityItems(packs, snapshots, proposals, []);
    const ready = items.find((item) => item.refs.pack_id === 'pack_ready');
    const blocked = items.find((item) => item.refs.pack_id === 'pack_blocked');
    const draft = items.find((item) => item.refs.pack_id === 'pack_draft');

    expect(ready?.status).toBe('ready_to_dispatch');
    expect(ready?.required_action).toBe('dispatch');

    expect(blocked?.status).toBe('ready_to_dispatch');
    expect(blocked?.blockers).toContain('Missing snapshot reference: missing_snapshot');

    expect(draft?.status).toBe('draft');
    expect(draft?.required_action).toBe('approve');
  });
});

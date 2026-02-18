import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthorityQueueWorkbench } from '../app/components/queue/AuthorityQueueWorkbench';
import { AgentPack } from '../lib/types';
import { deriveAuthorityItems } from '../lib/authority_queue';

const packs: AgentPack[] = [
  {
    pack_id: 'pack_draft',
    created_at: '2026-01-01T00:00:00.000Z',
    kind: 'issue',
    title: 'Draft pack',
    content_markdown: 'draft',
    inputs: {},
    status: 'draft',
  },
  {
    pack_id: 'pack_ready',
    created_at: '2026-01-02T00:00:00.000Z',
    kind: 'issue',
    title: 'Ready pack',
    content_markdown: 'ready',
    inputs: {},
    status: 'approved',
    approval_note: 'approved note',
  },
  {
    pack_id: 'pack_dispatched',
    created_at: '2026-01-03T00:00:00.000Z',
    kind: 'issue',
    title: 'Done pack',
    content_markdown: 'done',
    inputs: {},
    status: 'dispatched',
    approval_note: 'approved note',
  },
];

describe('AuthorityQueueWorkbench', () => {
  it('renders grouped sections and enforces note for approval', () => {
    const onSetStatus = vi.fn();
    const onDispatch = vi.fn(async () => {});
    const items = deriveAuthorityItems(packs, [], [], []);
    const packsById = Object.fromEntries(packs.map((pack) => [pack.pack_id, pack]));

    render(<AuthorityQueueWorkbench items={items} packsById={packsById} onSetStatus={onSetStatus} onDispatch={onDispatch} />);

    expect(screen.getByText('Needs Approval')).toBeInTheDocument();
    expect(screen.getByText('Ready to Dispatch')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('authority-approve-pack_draft'));
    expect(onSetStatus).not.toHaveBeenCalled();
    expect(screen.getByText('Approval note is required.')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('authority-note-pack_draft'), { target: { value: 'ship' } });
    fireEvent.click(screen.getByTestId('authority-approve-pack_draft'));
    expect(onSetStatus).toHaveBeenCalledWith('pack_draft', 'approved', 'ship');

    fireEvent.click(screen.getByTestId('authority-dispatch-pack_ready'));
    expect(onDispatch).toHaveBeenCalledWith('pack_ready');
  });

  it('disables actions when blockers are present', () => {
    const onSetStatus = vi.fn();
    const blockedPack: AgentPack = {
      pack_id: 'pack_blocked',
      created_at: '2026-01-01T00:00:00.000Z',
      kind: 'issue',
      title: 'Blocked pack',
      content_markdown: 'blocked',
      inputs: { snapshot_id: 'missing' },
      status: 'draft',
    };

    const items = deriveAuthorityItems([blockedPack], [], [], []);
    render(
      <AuthorityQueueWorkbench
        items={items}
        packsById={{ pack_blocked: blockedPack }}
        onSetStatus={onSetStatus}
        onDispatch={async () => {}}
      />
    );

    expect(screen.getByTestId('authority-approve-pack_blocked')).toBeDisabled();
    expect(screen.getByTestId('authority-blockers-pack_blocked')).toHaveTextContent('Missing snapshot reference: missing');
  });
});

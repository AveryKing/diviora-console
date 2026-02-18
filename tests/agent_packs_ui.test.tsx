import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { AgentPacksPanel } from '../app/components/agent/AgentPacksPanel';
import { AgentPack } from '../lib/types';

describe('AgentPacksPanel', () => {
  it('approving a draft updates status badge', () => {
    const initial: AgentPack[] = [
      {
        pack_id: 'pack_1',
        created_at: new Date().toISOString(),
        kind: 'review',
        title: 'Review Pack',
        content_markdown: '## Objective',
        inputs: { snapshot_id: 'ps_1', selected_goals: ['g1'] },
        status: 'draft',
      },
    ];

    function Harness() {
      const [packs, setPacks] = useState<AgentPack[]>(initial);
      return (
        <AgentPacksPanel
          packs={packs}
          latestSnapshotId="ps_1"
          proposedDraft={null}
          onCreateDraftPack={() => {}}
          onGenerateCodexTaskPacket={() => {}}
          onSetStatus={(pack_id, status, note) => {
            setPacks((prev) =>
              prev.map((pack) =>
                pack.pack_id === pack_id
                  ? {
                      ...pack,
                      status,
                      note,
                    }
                  : pack
              )
            );
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByTestId('agent-pack-note-input'), { target: { value: 'Looks good' } });
    fireEvent.click(screen.getByTestId('agent-pack-approve'));
    expect(screen.getByTestId('agent-pack-status-badge')).toHaveTextContent('approved');
  });

  it('shows codex task packet button only for approved issue packs', () => {
    const issueApproved: AgentPack = {
      pack_id: 'pack_issue',
      created_at: new Date().toISOString(),
      kind: 'issue',
      title: 'Issue Pack',
      content_markdown: '## Objective\\nTest',
      inputs: {},
      status: 'approved',
      approval_note: 'approved note',
    };

    const reviewApproved: AgentPack = {
      pack_id: 'pack_review',
      created_at: new Date().toISOString(),
      kind: 'review',
      title: 'Review Pack',
      content_markdown: '## Objective\\nTest',
      inputs: {},
      status: 'approved',
      approval_note: 'approved note',
    };

    const draftIssue: AgentPack = {
      pack_id: 'pack_draft',
      created_at: new Date().toISOString(),
      kind: 'issue',
      title: 'Draft Issue Pack',
      content_markdown: '## Objective\\nTest',
      inputs: {},
      status: 'draft',
    };

    const noop = () => {};

    const { rerender } = render(
      <AgentPacksPanel
        packs={[issueApproved]}
        latestSnapshotId="ps_1"
        proposedDraft={null}
        onCreateDraftPack={noop}
        onGenerateCodexTaskPacket={noop}
        onSetStatus={noop}
      />
    );
    expect(screen.getByTestId('agent-pack-generate-codex-task-packet')).toBeInTheDocument();

    rerender(
      <AgentPacksPanel
        packs={[reviewApproved]}
        latestSnapshotId="ps_1"
        proposedDraft={null}
        onCreateDraftPack={noop}
        onGenerateCodexTaskPacket={noop}
        onSetStatus={noop}
      />
    );
    expect(screen.queryByTestId('agent-pack-generate-codex-task-packet')).toBeNull();

    rerender(
      <AgentPacksPanel
        packs={[draftIssue]}
        latestSnapshotId="ps_1"
        proposedDraft={null}
        onCreateDraftPack={noop}
        onGenerateCodexTaskPacket={noop}
        onSetStatus={noop}
      />
    );
    expect(screen.queryByTestId('agent-pack-generate-codex-task-packet')).toBeNull();
  });
});

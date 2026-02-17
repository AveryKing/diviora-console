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
});

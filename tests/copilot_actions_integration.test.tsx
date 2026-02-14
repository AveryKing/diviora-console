import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraftCard } from '../app/components/home/DraftCard';
import { ContextPanel } from '../app/components/home/ContextPanel';
import { useStore } from '../lib/store';
import { useSessionStore } from '../lib/session_store';
import { BugTriageFieldsOutput } from '@/lib/copilot_actions_schema';

// Mock dependencies
vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('../lib/session_store', () => ({
  useSessionStore: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Pin: () => null,
  PinOff: () => null,
  Lightbulb: () => null,
}));

describe('Copilot Actions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStore).mockReturnValue({
      state: {
        proposals: [],
        runs: [],
        decisions: [],
        settings: { template_id: 'bug_triage', proposal_style: 'standard', default_step_count: 3, risk_level: 'low' }
      },
      addProposal: vi.fn(),
    } as unknown as ReturnType<typeof useStore>);
    
    vi.mocked(useSessionStore).mockReturnValue({
      currentSessionId: 'session-1',
      sessions: [{ session_id: 'session-1', pinned: {} }],
      actions: { pinContext: vi.fn() }
    } as unknown as ReturnType<typeof useSessionStore>);
  });

  describe('DraftCard with Extraction', () => {
    it('displays extracted bug fields when event is received', () => {
      render(<DraftCard />);
      
      const fields: BugTriageFieldsOutput = {
        title: "Test Bug",
        severity: "high",
        component: "Backend",
        description: "Something is broken in the API"
      };

      fireEvent(window, new CustomEvent('diviora:copilot-extraction', { 
        detail: { fields, template: 'bug_triage' } 
      }));

      expect(screen.getByText('Extracted Bug Fields')).toBeDefined();
      expect(screen.getByText('Test Bug')).toBeDefined();
      expect(screen.getByText('Backend')).toBeDefined();
    });

    it('populates composer when "Insert into Compose" is clicked', () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      render(<DraftCard />);
      
      const fields: BugTriageFieldsOutput = {
        title: "Test Bug",
        severity: "high",
        component: "Backend",
        description: "Something is broken"
      };

      fireEvent(window, new CustomEvent('diviora:copilot-extraction', { 
        detail: { fields, template: 'bug_triage' } 
      }));

      const insertBtn = screen.getByTestId('home-insert-draft-btn');
      fireEvent.click(insertBtn);

      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'diviora:insert-input'
      }));
      
      const eventCall = dispatchSpy.mock.calls.find(call => (call[0] as unknown as { type: string }).type === 'diviora:insert-input');
      expect((eventCall![0] as CustomEvent).detail.message).toContain('Title: Test Bug');
    });
  });

  describe('ContextPanel with Hints', () => {
    it('displays hints when event is received', () => {
      render(<ContextPanel />);
      
      const hintsData = {
        missing: ["repro_steps", "actual_result"],
        hints: ["Please add reproduction steps", "What actually happened?"]
      };

      fireEvent(window, new CustomEvent('diviora:copilot-hints', { 
        detail: hintsData 
      }));

      expect(screen.getByTestId('copilot-hints-panel')).toBeDefined();
      expect(screen.getByText('repro_steps')).toBeDefined();
      expect(screen.getByText('Please add reproduction steps')).toBeDefined();
    });
  });
});

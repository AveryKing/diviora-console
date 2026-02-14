import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotSidebarPanel } from '../app/components/CopilotSidebarPanel';
import { useStore } from '../lib/store';
import { usePathname } from 'next/navigation';

vi.mock('../lib/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('../app/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

describe('CopilotSidebarPanel UX', () => {
  const mockState = {
    proposals: [],
    settings: { template_id: 'bug_triage' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useStore as any).mockReturnValue({ state: mockState });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePathname as any).mockReturnValue('/');
    
    // Setup event listener for draft
    window.dispatchEvent(new CustomEvent('diviora:copilot-draft', { detail: { draft: 'Test draft' } }));
  });

  it('shows Insert button on home page', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePathname as any).mockReturnValue('/');
    render(<CopilotSidebarPanel />);
    
    // Re-fire event because component might have rendered before listener was ready in first tick?
    // Actually render and then fire.
    fireEvent(window, new CustomEvent('diviora:copilot-draft', { detail: { draft: 'Test draft' } }));

    expect(screen.getByTestId('copilot-insert-btn')).toBeInTheDocument();
  });

  it('hides Insert button on non-home pages', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePathname as any).mockReturnValue('/artifacts/123');
    render(<CopilotSidebarPanel />);
    
    fireEvent(window, new CustomEvent('diviora:copilot-draft', { detail: { draft: 'Test draft' } }));

    expect(screen.queryByTestId('copilot-insert-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('copilot-copy-btn')).toBeInTheDocument();
  });

  it('dispatches insertion event and shows toast when Insert is clicked', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePathname as any).mockReturnValue('/');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<CopilotSidebarPanel />);
    
    fireEvent(window, new CustomEvent('diviora:copilot-draft', { detail: { draft: 'Test draft' } }));

    const insertBtn = screen.getByTestId('copilot-insert-btn');
    fireEvent.click(insertBtn);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'diviora:insert-input',
      detail: { message: 'Test draft' }
    }));
    
    expect(screen.getByTestId('copilot-insert-toast')).toBeInTheDocument();
  });
});

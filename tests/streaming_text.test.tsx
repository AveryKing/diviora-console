import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreamingText } from '../app/components/StreamingText';
import * as reducedMotion from '../app/hooks/usePrefersReducedMotion';

vi.mock('../app/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: vi.fn(),
}));

describe('StreamingText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reducedMotion.usePrefersReducedMotion as any).mockReturnValue(false);
  });

  it('renders full text immediately if reduced motion is enabled', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reducedMotion.usePrefersReducedMotion as any).mockReturnValue(true);
    const text = 'Hello world, this is a long suggestion.';
    render(<StreamingText text={text} />);
    
    expect(screen.getByTestId('copilot-suggestion')).toHaveTextContent(text);
    expect(screen.queryByTestId('copilot-suggestion-cursor')).not.toBeInTheDocument();
  });

  it('shows full text when skip is clicked', async () => {
    const text = 'Streaming text that should be skipped.';
    render(<StreamingText text={text} />);

    // Initially partial or empty due to interval
    const skipButton = screen.getByTestId('copilot-suggestion-skip');
    fireEvent.click(skipButton);

    expect(screen.getByTestId('copilot-suggestion')).toHaveTextContent(text);
    expect(screen.queryByTestId('copilot-suggestion-cursor')).not.toBeInTheDocument();
  });
});

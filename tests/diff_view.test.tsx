import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiffView } from '../app/components/DiffView';

describe('DiffView', () => {
  it('renders original and modified text', () => {
    const original = 'original text';
    const modified = 'modified text';
    render(<DiffView original={original} modified={modified} />);
    
    expect(screen.getByTestId('copilot-diff-left')).toHaveTextContent(original);
    expect(screen.getByTestId('copilot-diff-right')).toHaveTextContent(modified);
  });

  it('calculates diff stats correctly (added chars)', () => {
    const original = 'abc';
    const modified = 'abcde'; // added 'd', 'e' -> +2 chars
    render(<DiffView original={original} modified={modified} />);
    
    expect(screen.getByTestId('copilot-diff-summary')).toHaveTextContent(/Added: 2 chars/);
    expect(screen.getByTestId('copilot-diff-summary')).toHaveTextContent(/Removed: 0 chars/);
  });

  it('calculates diff stats correctly (removed chars)', () => {
    const original = 'abcde';
    const modified = 'abc'; // removed 'd', 'e' -> -2 chars
    render(<DiffView original={original} modified={modified} />);
    
    expect(screen.getByTestId('copilot-diff-summary')).toHaveTextContent(/Added: 0 chars/);
    expect(screen.getByTestId('copilot-diff-summary')).toHaveTextContent(/Removed: 2 chars/);
  });
});

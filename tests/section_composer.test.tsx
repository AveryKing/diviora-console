import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionComposer } from '../app/components/SectionComposer';
import { assembleBugTriagePrompt } from '../lib/prompt_assembly';

describe('SectionComposer', () => {
    const mockOnAssemble = vi.fn();
    const draftText = `### Distilled Reproduction Steps
- Step 1

### Expected Outcome
Exp

### Actual Outcome
Act

### Suspected Cause
Cause

### Proposed Fix Plan
- Fix`;

    it('renders all bug triage fields', () => {
        render(<SectionComposer draft="" onAssemble={mockOnAssemble} />);
        
        expect(screen.getByTestId('composer-repro_steps')).toBeInTheDocument();
        expect(screen.getByTestId('composer-expected')).toBeInTheDocument();
        expect(screen.getByTestId('composer-actual')).toBeInTheDocument();
        expect(screen.getByTestId('composer-suspected_cause')).toBeInTheDocument();
        expect(screen.getByTestId('composer-fix_plan')).toBeInTheDocument();
    });

    it('fills fields from draft when button clicked', () => {
        render(<SectionComposer draft={draftText} onAssemble={mockOnAssemble} />);
        
        const fillBtn = screen.getByTestId('composer-fill-from-draft');
        fireEvent.click(fillBtn);

        expect(screen.getByTestId('composer-repro_steps')).toHaveValue('- Step 1');
        expect(screen.getByTestId('composer-expected')).toHaveValue('Exp');
        expect(screen.getByTestId('composer-actual')).toHaveValue('Act');
        expect(screen.getByTestId('composer-suspected_cause')).toHaveValue('Cause');
        expect(screen.getByTestId('composer-fix_plan')).toHaveValue('- Fix');
    });

    it('assembles prompt and calls onAssemble', () => {
        render(<SectionComposer draft={draftText} onAssemble={mockOnAssemble} />);
        
        // Fill first
        fireEvent.click(screen.getByTestId('composer-fill-from-draft'));

        // Modify a field to prove assembly uses current state
        fireEvent.change(screen.getByTestId('composer-expected'), { target: { value: 'Modified Exp' } });

        // Assemble
        fireEvent.click(screen.getByTestId('composer-assemble'));

        expect(mockOnAssemble).toHaveBeenCalledWith(expect.stringContaining('### Expected Outcome\nModified Exp'));
    });
});

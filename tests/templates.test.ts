import { describe, it, expect } from 'vitest';
import { generateProposalSections } from '../lib/templates';
import { Settings } from '../lib/types';

describe('Proposal Templates (Issue #10)', () => {
    const mockSettings: Settings = {
        schema_version: 1,
        proposal_style: 'detailed',
        risk_level: 'medium',
        default_step_count: 5,
        timeline_mode: 'expanded',
        template_id: 'generic'
    };

    const message = "Implement OAuth login";

    it('generates deterministic sections for generic template', () => {
        const sections = generateProposalSections('generic', message, mockSettings);
        
        expect(sections).toHaveLength(3);
        expect(sections[0].key).toBe('summary');
        expect(sections[1].key).toBe('next_actions');
        expect(sections[2].key).toBe('risks');
        
        // Determinism check
        const sections2 = generateProposalSections('generic', message, mockSettings);
        expect(sections2).toEqual(sections);
    });

    it('generates deterministic sections for sales_outreach template', () => {
        const sections = generateProposalSections('sales_outreach', message, mockSettings);
        
        expect(sections.map(s => s.key)).toEqual(['icp', 'offer', 'sequence', 'objections', 'risks']);
        expect(sections[0].title).toBe('Ideal Customer Profile (ICP)');
    });

    it('generates deterministic sections for bug_triage template', () => {
        const sections = generateProposalSections('bug_triage', message, mockSettings);
        
        expect(sections.map(s => s.key)).toEqual(['repro_steps', 'expected_actual', 'suspected_cause', 'fix_plan', 'risks']);
    });

    it('generates deterministic sections for project_plan template', () => {
        const sections = generateProposalSections('project_plan', message, mockSettings);
        
        expect(sections.map(s => s.key)).toEqual(['goal', 'milestones', 'dependencies', 'test_plan', 'risks']);
    });

    it('respects concise setting', () => {
        const conciseSettings = { ...mockSettings, proposal_style: 'concise' as const };
        const detailedSections = generateProposalSections('sales_outreach', message, mockSettings);
        const conciseSections = generateProposalSections('sales_outreach', message, conciseSettings);
        
        // Assert content is different
        expect(detailedSections[0].content).not.toBe(conciseSections[0].content);
    });

    it('respects step count setting', () => {
        const steps3 = { ...mockSettings, default_step_count: 3 as const };
        const steps7 = { ...mockSettings, default_step_count: 7 as const };
        
        const sections3 = generateProposalSections('generic', message, steps3);
        const sections7 = generateProposalSections('generic', message, steps7);
        
        const stepsSection3 = sections3.find(s => s.key === 'next_actions');
        const stepsSection7 = sections7.find(s => s.key === 'next_actions');
        
        expect(stepsSection3?.content).toHaveLength(3);
        expect(stepsSection7?.content).toHaveLength(7);
    });

    it('respects risk level setting', () => {
        const lowRisk = { ...mockSettings, risk_level: 'low' as const };
        const highRisk = { ...mockSettings, risk_level: 'high' as const };
        
        const sectionsLow = generateProposalSections('generic', message, lowRisk);
        const sectionsHigh = generateProposalSections('generic', message, highRisk);
        
        const riskSectionLow = sectionsLow.find(s => s.key === 'risks');
        const riskSectionHigh = sectionsHigh.find(s => s.key === 'risks');
        
        expect(riskSectionLow?.content).toHaveLength(1); // Base only
        expect(riskSectionHigh?.content).toHaveLength(1 + 3); // Base + 3 extra
    });
});

import { describe, it, expect } from 'vitest';
import { draftPromptSchema, bugTriageFieldsSchema, missingFieldsSchema } from '../lib/copilot_actions_schema';

describe('Copilot Actions Schemas', () => {
  describe('draftPromptSchema', () => {
    it('validates a correct draft prompt', () => {
      const result = draftPromptSchema.safeParse({ draft: "Draft content" });
      expect(result.success).toBe(true);
    });

    it('fails if draft is missing', () => {
      const result = draftPromptSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('bugTriageFieldsSchema', () => {
    it('validates correct bug triage fields', () => {
      const validFields = {
        title: "Bug 1",
        severity: "high",
        component: "UI",
        description: "Something broke",
      };
      const result = bugTriageFieldsSchema.safeParse(validFields);
      expect(result.success).toBe(true);
    });

    it('fails on invalid severity', () => {
      const invalidFields = {
        title: "Bug 1",
        severity: "extreme", // Invalid enum value
        component: "UI",
        description: "Something broke",
      };
      const result = bugTriageFieldsSchema.safeParse(invalidFields);
      expect(result.success).toBe(false);
    });

    it('fails on missing required field (component)', () => {
      const invalidFields = {
        title: "Bug 1",
        severity: "high",
        description: "Something broke",
      };
      const result = bugTriageFieldsSchema.safeParse(invalidFields);
      expect(result.success).toBe(false);
    });
  });

  describe('missingFieldsSchema', () => {
    it('validates correct missing fields data', () => {
      const validData = {
        missing: ["repro_steps"],
        hints: ["Please add reproduction steps"],
      };
      const result = missingFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('fails if missing is not an array', () => {
      const invalidData = {
        missing: "repro_steps",
        hints: ["hint"],
      };
      const result = missingFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

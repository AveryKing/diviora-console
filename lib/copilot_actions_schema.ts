import { z } from 'zod';

/**
 * Draft Prompt for Template Schema
 * Returns a raw text draft that can be inserted into the composer.
 */
export const draftPromptSchema = z.object({
  draft: z.string().describe("The drafted text for the proposal request."),
});

export type DraftPromptOutput = z.infer<typeof draftPromptSchema>;

/**
 * Extract Bug Triage Fields Schema
 * Extracts structured fields from a bug report text.
 */
export const bugTriageFieldsSchema = z.object({
  title: z.string().describe("Descriptive title of the bug."),
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe("Assessment of the bug's severity."),
  component: z.string().describe("The system component or module affected."),
  description: z.string().describe("Detailed description of the bug and its context."),
  repro_steps: z.string().optional().describe("Steps to reproduce the bug."),
  expected_behavior: z.string().optional().describe("What was expected to happen."),
  actual_result: z.string().optional().describe("What actually happened."),
});

export type BugTriageFieldsOutput = z.infer<typeof bugTriageFieldsSchema>;

/**
 * Suggest Missing Fields Schema
 * Provides hints about what's missing in the current proposal context.
 */
export const missingFieldsSchema = z.object({
  missing: z.array(z.string()).describe("List of field keys or sections that are missing or incomplete."),
  hints: z.array(z.string()).describe("Actionable hints on how to fill the missing fields."),
});

export type MissingFieldsOutput = z.infer<typeof missingFieldsSchema>;

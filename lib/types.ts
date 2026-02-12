import { z } from 'zod';

export const ProposalSchema = z.object({
  proposal_id: z.string(),
  created_at: z.string(),
  input: z.object({
    message: z.string(),
  }),
  proposal: z.object({
    title: z.string(),
    summary: z.string(),
    next_actions: z.array(z.string()),
    risks: z.array(z.string()),
  }),
});

export type Proposal = z.infer<typeof ProposalSchema>;

export const CompileRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  settings: z.object({
    proposal_style: z.enum(['concise', 'detailed']),
    risk_level: z.enum(['low', 'medium', 'high']),
    default_step_count: z.union([z.literal(3), z.literal(5), z.literal(7)]),
  }).optional(),
});

export type CompileRequest = z.infer<typeof CompileRequestSchema>;

export const DecisionSchema = z.object({
  decision_id: z.string(),
  proposal_id: z.string(),
  status: z.enum(['approved', 'rejected']),
  decided_at: z.string(),
  note: z.string().optional(),
});

export type Decision = z.infer<typeof DecisionSchema>;

export const RunPlanSchema = z.object({
  run_id: z.string(),
  proposal_id: z.string(),
  created_at: z.string(),
  status: z.literal('planned'),
  plan: z.object({
    objective: z.string(),
    steps: z.array(z.string()),
    inputs_needed: z.array(z.string()),
    expected_outputs: z.array(z.string()),
    risks: z.array(z.string()),
    rollback: z.array(z.string()),
  }),
});

export type RunPlan = z.infer<typeof RunPlanSchema>;

export const SettingsSchema = z.object({
  schema_version: z.literal(1),
  proposal_style: z.enum(['concise', 'detailed']),
  risk_level: z.enum(['low', 'medium', 'high']),
  default_step_count: z.union([z.literal(3), z.literal(5), z.literal(7)]),
  timeline_mode: z.enum(['compact', 'expanded']),
});

export type Settings = z.infer<typeof SettingsSchema>;



import { z } from 'zod';

export const ProposalSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  content: z.union([z.string(), z.array(z.string())]),
});

export type ProposalSection = z.infer<typeof ProposalSectionSchema>;

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
    template_id: z.string().optional(),
    sections: z.array(ProposalSectionSchema).optional(),
  }),
});

export type Proposal = z.infer<typeof ProposalSchema>;

export const CompileRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  settings: z.object({
    proposal_style: z.enum(['concise', 'detailed']),
    risk_level: z.enum(['low', 'medium', 'high']),
    default_step_count: z.union([z.literal(3), z.literal(5), z.literal(7)]),
    template_id: z.enum(['generic', 'sales_outreach', 'bug_triage', 'project_plan']).optional(),
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
  template_id: z.enum(['generic', 'sales_outreach', 'bug_triage', 'project_plan']).default('generic'),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const SnapshotV1Schema = z.object({
  snapshot_version: z.literal(1),
  exported_at: z.string(),
  app_version: z.string().optional(),
  settings: SettingsSchema,
  proposals: z.array(ProposalSchema),
  decisions: z.array(DecisionSchema),
  runs: z.array(RunPlanSchema),
});

export type SnapshotV1 = z.infer<typeof SnapshotV1Schema>;

export const AppMetadataSchema = z.object({
  last_exported_at: z.string().optional(),
  last_imported_at: z.string().optional(),
  last_imported_version: z.number().optional(),
});

export type AppMetadata = z.infer<typeof AppMetadataSchema>;

export const SnapshotV2Schema = z.object({
  snapshot_version: z.literal(2),
  exported_at: z.string(),
  app_version: z.string(),
  state_schema_versions: z.object({
    settings: z.number(),
    proposals: z.number(),
    decisions: z.number(),
    runs: z.number(),
  }),
  settings: SettingsSchema,
  proposals: z.array(ProposalSchema),
  decisions: z.array(DecisionSchema),
  runs: z.array(RunPlanSchema),
});

export type SnapshotV2 = z.infer<typeof SnapshotV2Schema>;

// Storage wrappers for versioning
export const ProposalsCollectionSchema = z.object({
  schema_version: z.literal(1),
  items: z.array(ProposalSchema),
});

export const DecisionsCollectionSchema = z.object({
  schema_version: z.literal(1),
  items: z.array(DecisionSchema),
});

export const RunsCollectionSchema = z.object({
  schema_version: z.literal(1),
  items: z.array(RunPlanSchema),
});

export type ScenarioId = 'happy_path' | 'flaky_inputs' | 'rate_limited' | 'validation_error';

export const RunTranscriptSchema = z.object({
  transcript_id: z.string(),
  run_id: z.string(),
  created_at: z.string(),
  status: z.literal('simulated'),
  scenario_id: z.enum(['happy_path', 'flaky_inputs', 'rate_limited', 'validation_error']).optional(), // Optional for backward/migration compat
  attempt: z.number().default(1),
  events: z.array(z.object({
    ts: z.string(),
    level: z.enum(['info', 'warn', 'error']),
    step_index: z.number(),
    message: z.string(),
    data: z.record(z.string(), z.unknown()).optional(),
  })),
});

export type RunTranscript = z.infer<typeof RunTranscriptSchema>;

export const TranscriptsCollectionSchema = z.object({
  schema_version: z.literal(1),
  items: z.array(RunTranscriptSchema),
});



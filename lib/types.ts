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
});

export type CompileRequest = z.infer<typeof CompileRequestSchema>;

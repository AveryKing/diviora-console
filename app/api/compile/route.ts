import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { CompileRequestSchema, Proposal } from '../../../lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = CompileRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { message } = result.data;

    // Generate stable ID based on message content
    const hash = createHash('sha256').update(message).digest('hex').substring(0, 12);
    const proposalId = `prop_${hash}`;

    // Create deterministic stub proposal
    const proposal: Proposal = {
      proposal_id: proposalId,
      created_at: new Date().toISOString(),
      input: { message },
      proposal: {
        title: `Draft Proposal for: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`,
        summary: `This is a generated summary for the requested message. It addresses the core intent: "${message}".`,
        next_actions: [
          "Review generated proposal details",
          "Validate assumptions with stakeholders",
          "Prepare implementation plan"
        ],
        risks: [
          "Limited context in initial request",
          "Potential for misunderstanding specific requirements",
          "Dependency on external Hub availability"
        ]
      }
    };

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

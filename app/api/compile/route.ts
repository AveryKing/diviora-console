import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { Proposal, CompileRequestSchema } from '../../../lib/types';

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

    const { message, settings } = result.data;

    // Use settings or defaults
    const proposalStyle = settings?.proposal_style || 'detailed';
    const riskLevel = settings?.risk_level || 'medium';
    const stepCount = settings?.default_step_count || 5;

    // Generate stable ID based on message content
    const hash = createHash('sha256').update(message).digest('hex').substring(0, 12);
    const proposalId = `prop_${hash}`;

    // Deterministic summary length based on style
    const baseSummary = `This is a generated summary for the requested message. It addresses the core intent: "${message}".`;
    const summary = proposalStyle === 'concise' 
      ? `Brief: ${message.substring(0, 100)}`
      : `${baseSummary} It has been analyzed with a focus on ${riskLevel} risk factors and satisfies the requirement for a ${proposalStyle} breakdown.`;

    // Deterministic actions based on step count
    const actions = Array.from({ length: stepCount }, (_, i) => `Step ${i + 1}: ${message.substring(0, 20)}... action`);

    // Deterministic risks based on risk level
    const baseRisks = ["Dependency on external Hub availability"];
    const risks = [...baseRisks];
    if (riskLevel === 'high') {
      risks.push("Critical path implementation risk", "Resource contention expected");
    } else if (riskLevel === 'medium') {
      risks.push("Potential for minor requirement drift");
    }

    // Create deterministic stub proposal
    const proposal: Proposal = {
      proposal_id: proposalId,
      created_at: new Date().toISOString(),
      input: { message },
      proposal: {
        title: `Proposal: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`,
        summary,
        next_actions: actions,
        risks,
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

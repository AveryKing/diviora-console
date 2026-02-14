import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { Proposal, CompileRequestSchema, Settings } from '../../../lib/types';
import { generateProposalSections, TemplateId } from '../../../lib/templates';

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

    const { message: rawMessage, settings } = result.data;
    const message = rawMessage.trim().replace(/\r\n/g, '\n');

    // Use settings or defaults
    const proposalStyle = settings?.proposal_style || 'detailed';
    const riskLevel = settings?.risk_level || 'medium';
    const stepCount = settings?.default_step_count || 5;
    const templateId = (settings?.template_id as TemplateId) || 'generic';

    // Construct full settings object for the helper
    const fullSettings: Settings = {
      schema_version: 1,
      proposal_style: proposalStyle,
      risk_level: riskLevel,
      default_step_count: stepCount,
      timeline_mode: 'expanded', // Not used in generation
      template_id: templateId,
    };

    // Generate stable ID based on message AND template
    const hashInput = `${message}-${templateId}-${stepCount}-${riskLevel}-${proposalStyle}`;
    const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, 12);
    const proposalId = `prop_${hash}`;

    // Generate sections using the template engine
    const sections = generateProposalSections(templateId, message, fullSettings);

    // Map sections to legacy fields for compatibility
    const displayMessage = message.replace(/\n/g, ' ');
    const title = `Proposal: ${displayMessage.substring(0, 30)}${displayMessage.length > 30 ? '...' : ''}`;
    
    let summary = sections[0].content;
    if (Array.isArray(summary)) summary = summary.join(" ");

    const nextActionsSection = sections.find(s => 
      s.key === 'next_actions' || 
      s.key === 'sequence' || 
      s.key === 'repro_steps' || 
      s.key === 'milestones'
    );
    const nextActions = Array.isArray(nextActionsSection?.content) 
      ? nextActionsSection.content 
      : ["See detailed sections for steps."];

    const risksSection = sections.find(s => s.key === 'risks');
    const risks = Array.isArray(risksSection?.content) 
      ? risksSection.content 
      : ["General operational risk"];

    // Create deterministic proposal with both legacy and new structure
    const proposal: Proposal = {
      proposal_id: proposalId,
      created_at: new Date().toISOString(),
      input: { message },
      proposal: {
        title,
        summary: typeof summary === 'string' ? summary : String(summary),
        next_actions: nextActions,
        risks: risks,
        template_id: templateId,
        sections: sections,
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

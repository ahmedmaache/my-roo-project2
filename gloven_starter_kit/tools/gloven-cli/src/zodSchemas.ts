import { z } from 'zod';

/**
 * Zod schemas mirroring JSON contracts from ai_prompts/output_contracts/
 */

// Criterion score definition (used in application scoring)
const CriterionScoreSchema = z.object({
  score: z.number().int().min(1).max(5).describe('Score 1-5 (1=weak, 5=exceptional)'),
  evidence: z.string().describe('Concise evidence or quote from application'),
  strengths: z.array(z.string()).describe('Bullet points of strengths'),
  concerns: z.array(z.string()).describe('Bullet points of concerns or gaps'),
});

// Application Score Schema (mirrors application_score_schema.json)
export const ApplicationScoreSchema = z.object({
  startup_name: z.string().describe('Company or project name'),
  team: CriterionScoreSchema.describe('Team assessment (25% weight)'),
  problem_size: CriterionScoreSchema.describe('Problem/market size assessment (20% weight)'),
  insight: CriterionScoreSchema.describe('Solution insight/uniqueness (15% weight)'),
  traction: CriterionScoreSchema.describe('Early traction/validation (15% weight)'),
  timing: CriterionScoreSchema.describe('Market timing (10% weight)'),
  fit: CriterionScoreSchema.describe('Program fit (10% weight)'),
  impact: CriterionScoreSchema.describe('Diversity & ecosystem impact (5% weight)'),
  weighted_total_0to100: z
    .number()
    .min(0)
    .max(100)
    .describe('Weighted total score (0-100 scale)'),
  decision: z.enum(['GO', 'NO_GO', 'WAITLIST']).describe('Final decision recommendation'),
  red_flags: z.array(z.string()).describe('Critical concerns or blockers'),
  followup_questions: z
    .array(z.string())
    .min(0)
    .max(5)
    .describe('Questions to ask in interview or follow-up'),
  summary: z
    .string()
    .min(50)
    .max(500)
    .describe('3-5 sentence human-readable assessment with recommendation'),
  reviewer: z.string().optional().describe('Name of reviewer (human or AI)'),
  review_date: z.string().optional().describe('Date of review (YYYY-MM-DD)'),
});

export type ApplicationScore = z.infer<typeof ApplicationScoreSchema>;

// Outreach Email Schema (mirrors outreach_email_schema.json)
export const OutreachEmailSchema = z.object({
  subject: z
    .string()
    .min(5)
    .max(90)
    .describe('Email subject line'),
  preview_text: z
    .string()
    .max(90)
    .describe('Preview text shown in inbox (Gmail, Outlook)'),
  body_markdown: z
    .string()
    .describe(
      'Email body in Markdown format with links and bold for skimming. Use merge fields like {first_name}, {company}, {startup}'
    ),
  cta: z.string().describe('Primary call-to-action text'),
  ps: z.string().optional().describe('Optional postscript'),
  audience_segment: z
    .enum(['founders', 'mentors', 'partners', 'press', 'investors', 'alumni'])
    .describe('Target audience for this email'),
  tone: z
    .enum(['warm', 'direct', 'celebratory', 'urgent', 'informational'])
    .describe('Email tone/style'),
  compliance: z
    .object({
      unsub_line: z
        .string()
        .default('You received this because you signed up at gloven.org. [Unsubscribe]')
        .describe('Unsubscribe footer text'),
      disclaimer: z.string().optional().describe('Optional legal disclaimer'),
    })
    .optional(),
  metadata: z
    .object({
      campaign_id: z.string().optional().describe('Campaign identifier for tracking'),
      send_date: z.string().optional().describe('Planned send date (YYYY-MM-DD)'),
      ab_variant: z.enum(['A', 'B', 'control']).optional().describe('A/B test variant'),
    })
    .optional(),
});

export type OutreachEmail = z.infer<typeof OutreachEmailSchema>;

// Dry-run placeholder generators
export function createDryRunApplicationScore(startupName: string): ApplicationScore {
  const criterionScore = {
    score: 4,
    evidence: 'DRY-RUN placeholder',
    strengths: ['Placeholder strength 1', 'Placeholder strength 2'],
    concerns: ['Placeholder concern'],
  };

  return {
    startup_name: startupName,
    team: criterionScore,
    problem_size: criterionScore,
    insight: criterionScore,
    traction: criterionScore,
    timing: criterionScore,
    fit: criterionScore,
    impact: criterionScore,
    weighted_total_0to100: 75,
    decision: 'WAITLIST',
    red_flags: [],
    followup_questions: [
      'What is your current runway?',
      'How will you acquire your first 100 customers?',
      'What is your biggest risk?',
    ],
    summary:
      'This is a DRY-RUN placeholder score. The application shows potential across multiple dimensions with a weighted score of 75/100. Recommend WAITLIST pending further review and clarification of go-to-market strategy.',
    reviewer: 'AI (DRY-RUN)',
    review_date: new Date().toISOString().split('T')[0],
  };
}

export function createDryRunEmail(): OutreachEmail {
  return {
    subject: 'DRY-RUN: Join Gloven Accelerator',
    preview_text: 'Transform your startup with our 12-week program',
    body_markdown: `Hi {first_name},

We're excited to invite you to apply to **Gloven Accelerator**.

**What we offer:**
- 12-week intensive program
- Expert mentorship
- Global network access

This is a DRY-RUN placeholder email.

Best regards,
The Gloven Team`,
    cta: 'Apply Now',
    audience_segment: 'founders',
    tone: 'warm',
  };
}
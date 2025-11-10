import type { LLMProvider } from '../providers/base.js';
import { loadSystemPrompt, buildUserPrompt } from '../promptLoader.js';
import { writeFile, resolvePath } from '../util/fs.js';
import { logCostEstimate } from '../util/costGuard.js';
import type { EnvConfig, GlovenConfig } from '../config.js';

export interface PartnersOptions {
  domains: string;
  mentors: string;
  partners: string;
  out: string;
}

/**
 * Generate partner and mentor target lists with outreach templates
 */
export async function generatePartners(
  provider: LLMProvider,
  options: PartnersOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  console.log('\n🤝 Generating partner & mentor lists...');
  console.log(`🔍 Domains: ${options.domains}`);
  console.log(`👥 Target mentors: ${options.mentors}`);
  console.log(`🏢 Target partners: ${options.partners}`);

  // Handle DRY_RUN mode
  if (envConfig.dryRun) {
    console.log('🏃 DRY-RUN mode: Using placeholder data');
    const dryRunPartners = getDryRunPartners(options);
    const outputPath = resolvePath(options.out);
    await writeFile(outputPath, dryRunPartners);
    console.log(`✅ Partner list saved to: ${outputPath}`);
    return;
  }

  // Load prompts
  const systemPrompt = await loadSystemPrompt(config.promptDir);
  const userPrompt = await buildUserPrompt('partners', config.promptDir, {
    domains: options.domains,
    mentors: options.mentors,
    partners: options.partners,
  });

  // Log cost estimate
  logCostEstimate(
    systemPrompt + userPrompt,
    envConfig.maxOutputTokens,
    envConfig.costPer1kInput,
    envConfig.costPer1kOutput
  );

  try {
    // Generate partner list from LLM
    const response = await provider.generate({
      system: systemPrompt,
      prompt: userPrompt,
      json: false,
      maxTokens: envConfig.maxOutputTokens,
    });

    // Write output
    const outputPath = resolvePath(options.out);
    await writeFile(outputPath, response);
    console.log(`✅ Partner list saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(`Partner list generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generate dry-run placeholder partners list
 */
function getDryRunPartners(options: PartnersOptions): string {
  return `# Partner & Mentor Sourcing (DRY-RUN)

Targeting ${options.mentors} mentors and ${options.partners} partners across ${options.domains}

## Part 1: Mentor Target List (Sample)

\`\`\`csv
Name,Role/Company,Domain,Region/Timezone,Contact Hint,Why a Fit,Suggested Offer/Ask,Warm Intro Path
Sarah Chen,VP Product at TechCorp,SaaS,US/PST,LinkedIn,10 years scaling B2B products,2 sessions/month on product strategy,Former colleague at Google
David Kim,CTO at DataFlow,AI/ML,EU/CET,Twitter DM,Built ML infrastructure at scale,Office hours on tech architecture,Mutual friend: Jane Doe
Maria Santos,Head of Growth at StartupX,SaaS,LATAM/BRT,Email,Took company from 0→$5M ARR,Growth workshop series,Y Combinator network
Alex Johnson,Founder at CloudScale,SaaS,APAC/SGT,LinkedIn,2 successful exits in B2B SaaS,1:1 fundraising mentorship,Portfolio company connection
\`\`\`

## Part 2: Partner Target List (Sample)

\`\`\`csv
Company,Product,Category,Typical Perk,Why Founders Need It,Decision Maker Role,Contact Hint,Intro Path
Vercel,Hosting Platform,Infrastructure,$500 credits,Deploy and scale quickly,Partnerships Lead,partnerships@vercel.com,Mutual investor
Stripe,Payments API,FinTech,$1K processing credits,Accept payments globally,Partner Manager,LinkedIn,Customer success contact
Notion,Workspace Tool,Productivity,Free team plan for 6mo,Organize operations,BD Manager,Twitter,Product Hunt community
AWS,Cloud Infrastructure,Infrastructure,$5K credits,Scalable infrastructure,Startup Programs,AWS Activate,Direct application
\`\`\`

## Part 3: Outreach Templates

### Template 1: Mentor Invite

**Subject:** Quick question about [specific expertise area]

Hi {first_name},

I came across your work at {company} and was impressed by {specific_achievement}.

I'm reaching out on behalf of Gloven, a global accelerator helping pre-seed founders find product-market fit. We're building our mentor network for our January cohort and would love to have you involved.

**What we're asking:**
- 1-2 video sessions per month (30 min each)
- Focus area: {domain} strategy and tactics
- Cohort: 8-12 high-potential teams from {regions}

**What you get:**
- First look at promising startups in {domain}
- Network with other world-class operators
- Optional: angel investing opportunities

Would you be open to a 15-minute call this week to discuss?

Best,
[Your name]

---

### Template 2: Partner Perk Proposal

**Subject:** Partnership opportunity: {Company} x Gloven Accelerator

Hi {first_name},

I'm {your_name} from Gloven, a global accelerator supporting 8-12 pre-seed startups per cohort.

Our founders are exactly who you want using {product}:
- Technical teams building {relevant category}
- Early adopters who become vocal advocates
- Growing 20-40% MoM on average

**Partnership proposal:**
- Offer {perk} to our cohort (12 companies, 2 cohorts/year)
- We feature you in our welcome kit and kick-off
- Optional: Co-host a workshop on {relevant topic}

**What's in it for you:**
- Pipeline of 24+ qualified users annually
- Brand association with top emerging startups
- Feedback from power users

Interested in exploring this? I have 3 time slots this week.

Best,
[Your name]

---

### Template 3: Workshop Co-Host

**Subject:** Co-host a workshop: "{workshop_topic}"

Hi {first_name},

Quick question: Would you be interested in co-hosting a 60-minute workshop for early-stage founders?

**Topic:** {workshop_topic} (e.g., "Scaling infrastructure from 0→1M users")

**Format:**
- 30 min: Your framework/case study
- 20 min: Live Q&A with founders
- 10 min: Wrap-up and resources

**Audience:**
- 30-50 technical founders
- Pre-seed to seed stage
- Highly engaged (avg 85% attendance rate)

**When:** We run workshops Thursdays at 10am PT / 6pm CET

We'll handle all logistics, recording, and promotion. You get exposure to top early-stage talent and can share your product/services if relevant.

Does this sound interesting? I can send a calendar invite with more details.

Thanks,
[Your name]

---

*Generated by Gloven CLI (DRY-RUN mode)*
`;
}
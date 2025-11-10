import type { LLMProvider } from '../providers/base.js';
import { loadSystemPrompt, buildUserPrompt } from '../promptLoader.js';
import { writeFile, resolvePath } from '../util/fs.js';
import { logCostEstimate } from '../util/costGuard.js';
import type { EnvConfig, GlovenConfig } from '../config.js';

export interface CalendarOptions {
  weeks: string;
  out: string;
}

/**
 * Generate editorial calendar
 */
export async function generateCalendar(
  provider: LLMProvider,
  options: CalendarOptions,
  config: GlovenConfig,
  envConfig: EnvConfig
): Promise<void> {
  console.log('\n📅 Generating editorial calendar...');
  console.log(`📆 Duration: ${options.weeks} weeks`);

  // Handle DRY_RUN mode
  if (envConfig.dryRun) {
    console.log('🏃 DRY-RUN mode: Using placeholder calendar');
    const dryRunCalendar = getDryRunCalendar(options);
    const outputPath = resolvePath(options.out);
    await writeFile(outputPath, dryRunCalendar);
    console.log(`✅ Calendar saved to: ${outputPath}`);
    return;
  }

  // Load prompts
  const systemPrompt = await loadSystemPrompt(config.promptDir);
  const userPrompt = await buildUserPrompt('calendar', config.promptDir, {
    weeks: options.weeks,
  });

  // Log cost estimate
  logCostEstimate(
    systemPrompt + userPrompt,
    envConfig.maxOutputTokens,
    envConfig.costPer1kInput,
    envConfig.costPer1kOutput
  );

  try {
    // Generate calendar from LLM
    const response = await provider.generate({
      system: systemPrompt,
      prompt: userPrompt,
      json: false,
      maxTokens: envConfig.maxOutputTokens,
    });

    // Write output
    const outputPath = resolvePath(options.out);
    await writeFile(outputPath, response);
    console.log(`✅ Calendar saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(`Calendar generation failed: ${(error as Error).message}`);
  }
}

/**
 * Generate dry-run placeholder calendar
 */
function getDryRunCalendar(options: CalendarOptions): string {
  return `# Editorial Calendar - ${options.weeks} Weeks (DRY-RUN)

## Part 1: Editorial Calendar

| Week | Asset | Angle/Hook | Format | CTA | KPI | Draft Headline |
|------|-------|------------|--------|-----|-----|----------------|
| 1 | Founder Journey | First 90 days post-launch | LinkedIn | Apply Now | 100 clicks | "From Idea to Traction: A Founder's First 90 Days" |
| 2 | PMF Deep-Dive | Finding product-market fit | Blog | Read More | 50 shares | "The 5 Signals You've Found Product-Market Fit" |
| 3 | Mentor Spotlight | Interview with SaaS mentor | Video | Watch | 200 views | "How This Mentor Scaled 3 Startups to $10M ARR" |
| 4 | Application Tips | What reviewers look for | Twitter | Apply | 150 retweets | "🧵 Insider secrets: What accelerator reviewers actually want to see" |

## Part 2: Sample Drafts

### 1. LinkedIn Post (150-200 words)

**Starting a startup is lonely. Here's what I wish someone told me on Day 1.**

Most founders don't fail because of their idea. They fail because they try to do everything alone.

At Gloven, we've seen hundreds of founders go from 0→1. The pattern is clear:

✅ The ones who succeed build a support network early
✅ They find mentors who've been there
✅ They join communities of peers facing similar challenges

Your product might pivot 5 times.
Your business model might change.
But your network? That compounds forever.

**That's why we built Gloven differently:**
→ 12-week intensive with operators who've scaled companies
→ Cohort-based learning with founders at your stage
→ Global network that extends far beyond the program

Applications open until [DATE]. Link in comments.

#startups #founders #accelerator

---

### 2. Twitter/X Thread (6-8 tweets)

🧵 THREAD: 5 mistakes every first-time founder makes (and how to avoid them)

I've reviewed 500+ startup applications. These patterns keep appearing:

1/ 📊 Mistake #1: Building in a vacuum

You're coding for 6 months without talking to users.

Fix: Talk to 10 potential customers THIS WEEK. Ship something ugly but useful in 2 weeks.

2/ 💰 Mistake #2: Confusing revenue with traction

$5K MRR from your mom's friends ≠ product-market fit

Fix: Track activation rate, retention, and organic growth. Those tell the real story.

3/ 👥 Mistake #3: Hiring too fast or too slow

Hiring your college roommate because it feels safe = slow death
Staying solo when you need a CTO = also slow death

Fix: Be painfully honest about skill gaps. Complement, don't clone.

4/ 🎯 Mistake #4: Trying to serve everyone

"Our target market is anyone with an internet connection"

Fix: Pick ONE persona. Dominate that niche. Expand later.

5/ ⏰ Mistake #5: Not setting a funding deadline

Fundraising drags on for 9 months while your product stagnates.

Fix: Set a hard deadline. Hit it or pivot to bootstrapping. Momentum > perfection.

Want to avoid these mistakes with expert guidance?

Gloven accepts 8-12 teams per cohort. Apply: [link]

---

### 3. Blog Post (600-800 words)

# The 5 Signals You've Found Product-Market Fit

*Most founders think they have PMF when they don't. Here's how to know for sure.*

Product-market fit is the most misunderstood concept in startups. Founders claim they have it at the first sign of revenue. Investors demand proof before they'll write a check. But what is it, really?

After reviewing hundreds of applications at Gloven, I've identified 5 clear signals that separate real PMF from wishful thinking.

## Signal #1: Users are ANGRY when your product breaks

Not just disappointed. Angry. They're flooding your inbox, DMing you on Twitter, calling your cell phone.

If your product goes down and nobody notices for 3 days? You don't have PMF yet.

**Why it matters:** This shows your product is now part of their workflow. It's not a nice-to-have—it's essential.

## Signal #2: Organic growth exceeds paid growth

You're spending $5K/month on ads but getting more signups from word-of-mouth.

**Test:** Turn off paid acquisition for 2 weeks. If growth drops to zero, you're buying users, not earning them.

## Signal #3: Retention curves flatten

Your monthly cohorts stop churning after 3-6 months. The curve goes horizontal.

This is the holy grail. It means you've built something people actually want to keep using.

## Signal #4: You can't keep up with inbound

You're turning down customer calls because your calendar is full. Support tickets are piling up faster than you can answer them.

Good problem to have. It means demand exceeds supply.

## Signal #5: Competitors start copying you

If you're doing something truly differentiated and valuable, competitors will notice. Imitation is validation.

## What to Do When You DON'T Have PMF Yet

Most founders don't have PMF in their first year. That's normal. Here's what to do:

1. **Talk to users relentlessly** - 5 user interviews per week, minimum
2. **Ship fast** - Weekly releases, not quarterly
3. **Watch the data** - Activation, retention, referral rates
4. **Be willing to pivot** - Your first idea is probably wrong

## How Gloven Helps

At Gloven, PMF is our obsession. Every mentor session, every workshop, every 1:1 is designed to help you find it faster.

Because once you have PMF, everything else gets easier.

**Ready to find your fit?** Applications for our next cohort close [DATE]. [Apply here]

---

## Part 3: Newsletter Template

**Subject:** The PMF playbook top accelerators don't want you to know

**Preview:** Plus: 3 founder interviews and our application deadline

---

Hi {first_name},

Most startup advice is garbage.

"Just talk to users!" "Iterate quickly!" "Find your niche!"

Cool. HOW?

This week, we're sharing the actual playbook—the one that helped 100+ Gloven companies find product-market fit in 12 weeks.

**🎯 This Week's Deep Dive: The PMF Sprint Framework**

[Link to blog post]

**💡 3 Founder Interviews You Can't Miss**

1. Sarah Chen (CloudMetrics AI) - How she scaled to $50K MRR in 6 months
2. David Park - Building in public on Twitter (100K → 500K followers)
3. Maria Santos - Pivoting from B2C to B2B (and 10x-ing revenue)

**📢 Last Call: Applications Close in 2 Weeks**

We're accepting 10 teams for our January cohort.

If you're pre-seed, globally distributed, and ready to go all-in for 12 weeks, [apply here].

**📚 This Week's Resources**
- Template: Our exact PMF survey (copy/paste ready)
- Checklist: 20-point pre-launch validation list
- Video: "How to run effective user interviews" (12 min)

See you next week,
The Gloven Team

P.S. Forward this to a founder who needs it. We'll send them a free PMF audit.

---

*Generated by Gloven CLI (DRY-RUN mode)*
`;
}
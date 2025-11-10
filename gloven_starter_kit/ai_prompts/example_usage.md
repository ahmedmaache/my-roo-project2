# Example Usage — Copy/Paste Workflows

Real-world examples of using the Gloven AI Growth Prompts system.

---

## Example 1: 30/60/90 Growth Plan (EMEA + LATAM)

### Step 1: Set System Prompt

Paste the entire contents of [`growth_os_system_prompt.md`](growth_os_system_prompt.md) into your LLM's **System** or **Developer** field.

### Step 2: Paste Task Prompt

Open [`task_prompts/a_founder_acquisition_30_60_90.md`](task_prompts/a_founder_acquisition_30_60_90.md), fill in the context:

```
TASK: Draft a 30/60/90-day founder acquisition plan for Gloven.

CONTEXT:
- Regions: EMEA + LATAM
- Focus: Pre-seed SaaS, AI/ML, fintech
- Capacity: 10 teams
- Channels to prioritize: (1) content, (2) partner communities, (3) mentor referral, (4) lightweight paid
- Budget: $8,000/month
- Goal: 300 qualified applications
- Deadline: 90 days from 2026-01-01

OUTPUT_FORMAT: Markdown with sections: TL;DR, Goals & KPIs, ICPs, Messaging, Channels & Plays, Calendar, Experiment Backlog, Budget, Risks & Mitigations.
```

### Step 3: Submit & Receive Output

The LLM returns a complete Markdown plan you can copy to Notion, Google Docs, or Airtable.

**Expected result:**
- TL;DR (2-3 sentences)
- KPI table with baseline → 30d → 60d → 90d targets
- 3 founder personas (ICP)
- Value props + messaging framework
- 4 channels with 2-3 plays each
- Week-by-week calendar
- 10 experiments with ICE scores
- Budget breakdown
- Risk register

---

## Example 2: Score Application in 30 Seconds

### Setup

System prompt: Already loaded from Example 1

### Task

Paste [`task_prompts/d_application_scoring.md`](task_prompts/d_application_scoring.md) with application data:

```
TASK: Score this startup application using Gloven's rubric and recommend Go/No-Go.

INPUT:
Startup name: CloudMetrics AI
One-liner: Real-time cloud cost optimization using ML
Founders:
- Sarah Chen (CEO) - Ex-AWS PM, 8 years cloud infrastructure
- David Park (CTO) - PhD ML, built similar tool at Google Cloud
Location: Berlin + Seoul (remote)
Problem: Companies waste 30-40% of cloud spend on idle resources
Solution: ML model predicts usage patterns, auto-scales resources, saves 25-35% monthly
Traction: $15k MRR, 12 paying customers (5-50 employees), 40% MoM growth
Business model: $99-$999/month SaaS based on cloud spend
Team background: Both full-time, 2 years working together, $200k pre-seed raised
Why Gloven: Need help with US GTM strategy and enterprise sales playbook
```

### Output

JSON with scores, decision, follow-ups:

```json
{
  "startup_name": "CloudMetrics AI",
  "team": {"score": 5, "evidence": "Ex-AWS PM + ML PhD, proven domain expertise", "strengths": ["Deep cloud knowledge", "2 years together"], "concerns": []},
  "problem_size": {"score": 4, "evidence": "Cloud cost is universal pain, $30B+ TAM", "strengths": ["Clear ROI"], "concerns": ["Competitive market"]},
  "weighted_total_0to100": 78,
  "decision": "GO",
  "red_flags": [],
  "followup_questions": ["What's your moat vs AWS Cost Explorer?", "How do you handle enterprise security requirements?"],
  "summary": "Exceptional team with strong domain fit. Early traction validates problem. Recommend GO with deep-dive on competitive positioning."
}
```

**Time:** ~30 seconds from paste to decision

---

## Example 3: 6-Week Content Calendar + Drafts

### Task

Use [`task_prompts/b_content_editorial_calendar.md`](task_prompts/b_content_editorial_calendar.md):

```
TASK: Build a 6-week editorial calendar to attract pre-seed founders to apply to Gloven.

CONTEXT:
- Themes: PMF tactics, founder stories, mentor spotlights, "Why Gloven", application tips
- Formats: Blog, LinkedIn, X/Twitter, newsletter
- Tone: Warm, practical, globally inclusive
- Focus weeks: W1-W6 of January 2026
- Special events: Application deadline W5 (Jan 31)
- Priority: LinkedIn 60%, X 30%, Blog 10%
```

### Output

1. **Editorial calendar table** (12-18 pieces)
2. **3 ready-to-publish drafts:**
   - LinkedIn post (150-200 words)
   - X thread (6-8 tweets)
   - Blog post (600-800 words)
3. **Newsletter template** (300-400 words)

**Time to output:** 2-3 minutes  
**Time savings:** ~6-8 hours of manual work

---

## Example 4: Rapid Iteration with Micro-Prompts

### Workflow

**Goal:** Create LinkedIn content for mentor recruitment

```
User: /mentor-DM
```

**AI returns:**
```
Subject: Light-touch mentoring with Gloven founders

Hi {first_name},

I noticed your work on {achievement} and thought you'd be perfect for Gloven's mentor network.

Our ask: 1-2 video sessions per month (60-90 min) with pre-seed founders in {domain}. We handle all scheduling and prep—you bring your expertise.

In return: early access to talented teams, optional investment access, and recognition on gloven.org.

Interested in a quick intro call?

Best,
{your_name}
```

**User refines:**
```
/mentor-DM but make it more specific to AI/ML mentors and mention our mentor community Slack
```

**AI returns updated version:**
```
Subject: AI/ML mentoring with Gloven — 90 min/month

Hi {first_name},

Given your background in {ml_achievement}, I'd love to invite you to Gloven's AI/ML mentor collective.

The commitment: 1-2 sessions/month with pre-seed AI founders. We curate matches, handle logistics, and provide session guides.

You get: early deal flow, a tight-knit mentor community (active Slack with 40+ ML operators), and optional co-investment rights.

15-min intro call to learn more?

{your_name}
```

**Iteration time:** <60 seconds per round

---

## Example 5: A/B Test Landing Page Headlines

### Micro-Prompt

```
/LP-A/B
```

### Output

**Variant A (Control):**
```
H1: Where bold ideas rise to go global
Subhead: 12-week incubator for pre-seed founders. Non-dilutive. Global access. Evidence-based.
Hypothesis: Emotional hook ("rise, global") drives applications
Test metric: Apply button clicks / unique visitors
```

**Variant B (Benefit-Focused):**
```
H1: Reach product-market fit in 12 weeks
Subhead: Join 300+ founders in our global incubator. Expert mentors. No equity taken.
Hypothesis: Tactical benefit ("PMF in 12 weeks") converts better
Test metric: Apply button clicks / unique visitors
```

**Variant C (Authority Play):**
```
H1: The global incubator backed by operators from Google, Stripe, and YC
Subhead: 12-week program for pre-seed software founders. Non-dilutive. Remote-friendly.
Hypothesis: Social proof in H1 increases trust and applications
Test metric: Apply button clicks / unique visitors
```

**Implementation:**
1. Split traffic 33/33/33
2. Run for 2 weeks or 300 visitors per variant
3. Measure: Click-through rate, application starts, qualified apps
4. Winner becomes new control

---

## Example 6: Crisis Communication

### Scenario

A founder tweets: "Gloven rejected us after 3 interviews. Waste of time."

### Micro-Prompt

```
/crisis-response: A founder publicly complained about our selection process on Twitter, saying "3 interviews then rejected—waste of time." Draft a public response that acknowledges their frustration, explains our process, and maintains our brand.
```

### Output

```
We're sorry the process felt frustrating. Our multi-stage selection (application → interview → committee) helps us find the best mutual fit—but we know it's tough when the answer is no.

We review 300+ applications per cohort and can only accept 8-12 teams. Each "no" is difficult and never a reflection of founder potential.

We're happy to share specific feedback if helpful. Thank you for applying, and we're cheering you on.

— Team Gloven
```

**Tone:** Empathetic, transparent, professional  
**Time:** <2 minutes from incident to drafted response

---

## Example 7: Chain Prompts for Complete Campaign

### Step-by-Step Workflow

**Goal:** Launch partner recruitment campaign

```
1. /partner-email
   → Get outreach template

2. Paste template into Task C (partner sourcing)
   → Get 20-company target list

3. /ad-concepts for LinkedIn partner ads
   → Get 5 ad variants

4. /LP-A/B for partner landing page
   → Get 3 headline variants

5. /sprint-plan for 1-week execution
   → Get daily task breakdown
```

**Total time:** 15-20 minutes  
**Output:** Complete campaign ready to execute

---

## Example 8: Weekly Newsletter (Recurring Task)

### Automation

**Every Monday morning:**

```
/newsletter-draft

Context:
- Last week: 8 new applications, 2 mentor spotlight sessions, 1 blog post published
- This week: Application deadline reminder (Friday), AMA with Sarah Chen (Wednesday)
- CTA: Apply by Friday for Cohort 02
```

**AI generates newsletter in <60 seconds**  
**Editor spends 5 min on final personalization**  
**Send via email tool**

---

## Tips for Success

### 1. Save Your Context
Create a "context doc" with your standard inputs:
- Target regions
- Cohort dates
- Budget ranges
- Current metrics
- Brand voice notes

Paste this into prompts to save time.

### 2. Version Your Outputs
Save outputs with dates:
- `growth_plan_2026-01-15.md`
- `content_calendar_jan_2026.md`
- `application_scores_cohort02.json`

### 3. Create Feedback Loop
After running a campaign:
- Record actual results
- Feed back to AI: "This ad got 0.8% CTR, below target. Analyze and suggest improvements."
- Iterate

### 4. Combine Tools
- AI generates → Human edits → Grammarly → Send
- AI scores apps → Human reviews borderline cases → Final decision
- AI drafts content → Designer adds visuals → Schedule

### 5. Use JSON for Automation
Request JSON output for:
- Application scores → Auto-populate Airtable
- Email templates → Mail merge tools
- Growth plans → Project management software

---

## Common Workflows by Role

### Program Director
- `/quick-score` for every application
- Task D for deep dives on finalists
- Task G for Demo Day investor prep

### Marketing Lead
- Task B for monthly content planning
- `/thread` and `/linkedin-post` for daily social
- Task F for PR launches

### Community Manager
- `/mentor-DM` for recruiter outreach
- Task C for partner development
- `/newsletter-draft` for weekly updates

### Founder (using Gloven)
- Task E for landing page iteration
- `/pitch-deck` (custom micro-prompt)
- `/investor-email` for Demo Day follow-ups

---

**Next:** Try running Example 1 or 2 yourself to see the system in action.
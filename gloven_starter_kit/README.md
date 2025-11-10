# Gloven — Global Ventures Starter Kit
**Version:** 2025-11-09

Welcome to the birth bundle for **Gloven (Global Ventures)**. This kit gives you a complete operational starting point: brand, legal templates (non‑binding), program design, website, marketing, OKRs, finance models, day‑one checklists, **and production-grade AI growth prompts**.

> ⚠️ **Disclaimer**: Templates here are for informational purposes only and **not legal, financial, or tax advice**. Have qualified counsel review before use.

## Contents
- `brand/` – Mission, narrative, tagline, palette, typography, voice
- `web/landing/` – Production‑ready static landing page (HTML/CSS/JS)
- **`portal/` – Next.js public portal with leaderboard, reports, and Slack integration** ⭐ NEW
- `ops/` – Playbook, cohort calendar, onboarding checklists
- `forms/` – Founder application (questions you can paste into a form tool)
- `rubrics/` – Selection rubric and scoring model
- `emails/` – Acceptance, rejection, mentor & partner outreach templates
- `marketing/` – Go‑to‑market, social handles, press release
- `dns/` – Suggested DNS, email authentication (SPF, DKIM, DMARC)
- `legal/` – Program agreement, mentor MoU, partner MoU, SAFE overview
- `policies/` – Code of Conduct, Anti‑Harassment, DEI statement
- `demo_day/` – Run of show, deck outline, investor list template
- `finance/` – Year‑1 operating budget (CSV) + KPI definitions
- `okrs/` – Quarter-by-quarter OKRs
- `hr/` – Org chart, hiring plan, role descriptions
- `risk/` – Risk register & mitigations
- **`ai_prompts/` – Production LLM prompts for growth, marketing, and operations** ⭐
- **`tools/gloven-cli/` – Production CLI for automation & CRM sync** ⭐

## 🤖 AI Growth System (NEW)

The [`ai_prompts/`](ai_prompts/) directory contains a complete AI copilot system for growth work:

- **Growth OS System Prompt** – Drop into ChatGPT/Claude/Gemini for instant expertise
- **8 Task Prompts** – Proven templates for acquisition, content, scoring, PR, Demo Day
- **Micro-prompts** – One-liners for speed (`/thread`, `/mentor-DM`, `/LP-A/B`)
- **JSON Schemas** – Automation-ready outputs for CRM/email tools
- **Policy Add-ons** – Security, citations, accessibility, regional modes

**Quick Start:** See [`ai_prompts/QUICKSTART.md`](ai_prompts/QUICKSTART.md) – Get your first output in 5 minutes.

**Use Cases:**
- Score 300 applications in hours (vs weeks)
- Generate 6-week content calendars in 3 minutes
- Build investor target lists with personalized outreach
- Create press kits, landing page copy, growth plans

**Time Savings:** 80-95% reduction in manual work; cost ~$30-60/month.

## 🔧 AI Automations & CLI Tool

The [`tools/gloven-cli/`](tools/gloven-cli/) directory contains a production-ready CLI that automates growth tasks using the AI prompts:

**What it does:**
- ✅ Generate 30/60/90 day growth plans with KPIs and experiments
- ✅ Create editorial calendars with ready-to-publish content
- ✅ Build mentor/partner target lists with outreach templates
- ✅ Score applications using Gloven's rubric (JSON + human-readable)

**Key Features:**
- **DRY-RUN Mode**: Test without API costs (returns schema-valid placeholders)
- **Multi-Provider Support**: OpenAI, Anthropic, OpenRouter
- **Cost Tracking**: Token estimation and guardrails
- **CI/CD Ready**: GitHub Actions workflow for automated scoring
- **TypeScript + Zod**: Fully typed with runtime validation

**Quick Start:**
```bash
cd gloven_starter_kit/tools/gloven-cli
npm install && npm run build

# Score an application (DRY-RUN mode, zero cost)
DRY_RUN=true node dist/index.js score \
  --input ../../data/apps/sample_application.json \
  --out ../../out/score.json
```

See [`tools/gloven-cli/README.md`](tools/gloven-cli/README.md) for complete documentation.

## 🌐 Portal & Integrations (NEW)

The [`portal/`](portal/) directory contains a complete Next.js web portal and CRM integrations:

**Public Portal Features:**
- 🏠 **Home**: Brand showcase and program overview
- 📊 **Cohort Leaderboard**: Live application rankings (PII-redacted)
- 📈 **Weekly Reports**: Health metrics and operational KPIs
- ❓ **FAQ**: Program information and support
- 🔔 **Slack Integration**: `/gloven-health` and `/gloven-top` commands

**CRM Connectors:**
- 📋 **Airtable**: Bi-directional sync for applications, mentors, investors
- 📊 **Google Sheets**: Import/export with service account auth
- 🔒 **Data Sanitization**: Automatic PII removal for public display
- 📤 **Portal Publishing**: One-command data publishing with validation

**Quick Start:**
```bash
# Setup portal
cd gloven_starter_kit/portal
npm install
npm run dev

# Publish data from CLI
cd ../tools/gloven-cli
DRY_RUN=true node dist/index.js publish-portal-data \
  --out ../portal/public/data
```

**Key Commands:**
- `gloven sync-airtable pull/push` - Sync with Airtable tables
- `gloven sync-sheets pull/push` - Sync with Google Sheets
- `gloven publish-portal-data` - Generate sanitized portal files

**Automation:**
- Weekly auto-publish via GitHub Actions (Mondays 9:30 UTC)
- Pull request previews with data validation
- Vercel deployment integration

See [`portal/README.md`](portal/README.md) for deployment guide.

## Suggested domain strategy
- **gloven.org** → Public website (mission, programs, apply, partners, press)
- **gloven.net** → Private founder/mentor portal (community, resources, forms)

## 90‑Day Launch Path
1. Set up domains, email auth, and the landing page (see `dns/` and `web/landing/`).
2. Publish the application form; activate CRM and analytics.
3. Recruit mentors/partners; announce Program #1; begin application sprints.
   - **AI Boost:** Use [`ai_prompts/task_prompts/c_partner_mentor_sourcing.md`](ai_prompts/task_prompts/c_partner_mentor_sourcing.md) for target lists
4. Run selection using the rubric; finalize cohort; send agreements.
   - **AI Boost:** Use [`ai_prompts/task_prompts/d_application_scoring.md`](ai_prompts/task_prompts/d_application_scoring.md) for scoring
5. Kick off 12‑week program; track KPIs; prepare Demo Day.
   - **AI Boost:** Use [`ai_prompts/task_prompts/g_demo_day_investor_targeting.md`](ai_prompts/task_prompts/g_demo_day_investor_targeting.md) for investor outreach

## What's Included

### ✅ Complete Brand Identity
- Mission, vision, values (G-L-O-V-E-N)
- Color palette, typography, voice guidelines
- Logo usage notes

### ✅ Production Website
- Responsive HTML/CSS/JS landing page
- Dark mode support
- Privacy & Terms pages
- Deploy to Vercel/Netlify in minutes

### ✅ Program Operations
- 12-week cohort calendar
- Onboarding checklists
- Playbook with tools & rhythms
- OKRs for Q1-Q2

### ✅ Legal Framework
- 6 template agreements (program, mentor, partner, SAFE)
- Privacy policy, Terms of Service
- Anti-harassment policy, Code of Conduct

### ✅ Selection & Scoring
- Application form (36 questions)
- Weighted rubric (CSV)
- Scoring guidance (1-5 scale)

### ✅ Marketing & Growth
- Go-to-market plan
- Press release template
- Social handles strategy
- Email templates (5 types)

### ✅ Finance & HR
- Year 1 budget (monthly breakdown)
- KPI definitions (7 metrics)
- Org chart, hiring plan, role descriptions

### ✅ Demo Day
- Run of show, pitch deck outline
- Investor list template

### ✅ **AI Growth Copilot** ⭐
- System prompt for ChatGPT/Claude/Gemini
- 8 proven task templates
- 30+ micro-prompts
- JSON output schemas
- Integration guides (Airtable, Slack, email tools)

## Quick Links

| Need | File | Time |
|------|------|------|
| Brand colors & fonts | [`brand/brand_guidelines.md`](brand/brand_guidelines.md) | 2 min |
| Launch website | [`web/landing/index.html`](web/landing/index.html) | 10 min |
| Set up email | [`dns/dns_records.txt`](dns/dns_records.txt) | 30 min |
| Application questions | [`forms/application_form.md`](forms/application_form.md) | 5 min |
| Score applications | [`rubrics/selection_rubric.csv`](rubrics/selection_rubric.csv) | 5 min |
| **AI setup** | [`ai_prompts/QUICKSTART.md`](ai_prompts/QUICKSTART.md) | **5 min** |
| Send acceptance email | [`emails/acceptance_email.txt`](emails/acceptance_email.txt) | 2 min |
| Plan cohort | [`ops/cohort_calendar.md`](ops/cohort_calendar.md) | 10 min |
| Prepare Demo Day | [`demo_day/run_of_show.md`](demo_day/run_of_show.md) | 15 min |

## Customization

1. **Find & Replace:**
   - "Gloven" → Your accelerator name
   - "#00A7A7" → Your primary color
   - "gloven.org" → Your domain

2. **Legal Review:**
   - All `legal/` templates → Have counsel review
   - Update jurisdiction in agreements
   - Customize to your investment structure

3. **Brand Refresh:**
   - Replace colors in `web/landing/styles.css`
   - Update `brand/brand_guidelines.md`
   - Generate logo with designer

4. **AI Customization:**
   - Edit [`ai_prompts/growth_os_system_prompt.md`](ai_prompts/growth_os_system_prompt.md) → Update brand section
   - Add regional modes from [`ai_prompts/policy_addons.md`](ai_prompts/policy_addons.md)

## Who This Is For

- **Launching a new accelerator?** Use everything as-is with light customization
- **Scaling existing program?** Cherry-pick components (OKRs, rubric, AI prompts)
- **Corporate innovation team?** Adapt for intrapreneurship programs
- **University program?** Customize for student founders

## Support & Community

- **Documentation:** Each directory has a README or inline comments
- **AI Help:** See [`ai_prompts/example_usage.md`](ai_prompts/example_usage.md) for workflows
- **Updates:** Check version date at top; we'll ship improvements

## License

This starter kit is provided as-is for Gloven (Global Ventures) operations. Legal templates are **not legal advice** and must be reviewed by qualified counsel before use.

---

**Version History:**
- 2025-11-09b: Added Portal + Integrations Pack (Next.js portal, CRM connectors, Slack API, CI/CD workflows)
- 2025-11-09: Added AI prompts system + CLI automation tool (Growth OS, 8 tasks, micro-prompts, integrations, production CLI)
- 2025-11-08: Initial release (brand, web, ops, legal, marketing, finance)

**Next Steps:**
1. Read [`ai_prompts/QUICKSTART.md`](ai_prompts/QUICKSTART.md) to set up your AI copilot
2. Try the CLI: [`tools/gloven-cli/README.md`](tools/gloven-cli/README.md) for automated workflows
3. Deploy the portal: [`portal/README.md`](portal/README.md) for public leaderboard and integrations
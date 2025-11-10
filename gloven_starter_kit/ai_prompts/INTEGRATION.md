# Integration Guide — Connecting AI Prompts to Gloven Operations

How to integrate AI-generated outputs into your actual Gloven workflow.

---

## 1. CRM Integration (Airtable/HubSpot)

### Application Scoring → Airtable

**Workflow:**
1. AI scores application using Task D → JSON output
2. Zapier/Make.com watches for new scores
3. Auto-populate Airtable base with:
   - Startup name
   - Weighted score
   - Decision (GO/NO_GO/WAITLIST)
   - Follow-up questions
   - Red flags

**Setup:**
```javascript
// Zapier webhook to Airtable
{
  "trigger": "New Application Scored",
  "action": "Create Airtable Record",
  "mapping": {
    "Name": "{{startup_name}}",
    "Score": "{{weighted_total_0to100}}",
    "Decision": "{{decision}}",
    "Summary": "{{summary}}",
    "Followup": "{{followup_questions}}"
  }
}
```

### Mentor/Partner Lists → HubSpot

**Workflow:**
1. AI generates target list (Task C) → CSV output
2. Import CSV to HubSpot
3. Trigger email sequences
4. Track outreach status

---

## 2. Email Automation (SendGrid/Mailchimp)

### Newsletter Workflow

1. **Monday morning:** Run micro-prompt `/newsletter-draft` with week's updates
2. **Export JSON:** Use outreach_email_schema.json format
3. **Mailchimp import:**
   - Subject → Campaign subject
   - Body_markdown → Convert to HTML (use Markdown converter)
   - Audience_segment → List filter
4. **Schedule send:** Wednesday 10 AM local time

**Markdown to HTML Converter:**
```bash
# Using pandoc
pandoc newsletter.md -o newsletter.html

# Or online: https://markdowntohtml.com
```

---

## 3. Project Management (Notion/Linear)

### Growth Plan → Notion Database

**From Task A (30/60/90 Plan):**

1. Create Notion database with columns:
   - Week (select: Week 1-12)
   - Initiative (text)
   - Owner (person)
   - KPI (number)
   - Status (select: Not started, In progress, Completed)

2. Copy AI-generated calendar table → Paste as CSV → Import to Notion

3. Link to OKR database for tracking

### Experiments → Linear Issues

**From Task H (Growth Experiments):**

1. Each experiment row → Linear issue
2. Use ICE score as priority
3. Labels: Channel name (Content, Social, Paid, etc.)
4. Assignee: From "Owner" column
5. Due date: Start + Duration

---

## 4. Social Media Scheduling (Buffer/Hootsuite)

### Content Calendar → Buffer

**From Task B (Editorial Calendar):**

1. Export table to CSV
2. Use Buffer CSV import:
   - Week → Scheduled date (calculate from start date)
   - Asset → Post text
   - Format → Profile (LinkedIn/Twitter/etc.)
   - CTA → Link URL

3. AI-generated drafts → Queue in Buffer
4. Add images (use Canva/Figma)
5. Schedule across time zones

**Time zone optimization:**
- EMEA: 9-11 AM CET
- Americas: 10 AM-12 PM EST/PST
- APAC: 9-11 AM SGT/JST

---

## 5. Analytics Dashboard (Google Sheets/Looker)

### OKR Tracking

**Connect AI outputs to live metrics:**

1. **Growth Plan Template** → Google Sheets
2. **Add formula columns:**
   ```
   =GOOGLEANALYTICS("ga:sessions", Start, End, "ga:source==linkedin")
   =QUERY(Applications!A:D, "SELECT COUNT(A) WHERE B='Qualified'")
   ```
3. **Auto-refresh daily**
4. **Alert if target not met:** Conditional formatting + Slack webhook

**Example dashboard:**
| Metric | Baseline | Target | Current | % to Goal | Status |
|--------|----------|--------|---------|-----------|--------|
| Qualified apps | 0 | 300 | 127 | 42% | 🟡 On track |
| Mentor sessions | 0 | 80 | 45 | 56% | 🟢 Ahead |

---

## 6. Slack/Discord Automation

### Weekly AI Summary Bot

**Setup:**
1. Create Slack webhook
2. Monday 9 AM: Auto-trigger `/doc-summary` with last week's data
3. Post to #growth channel

**Slash commands:**
- `/gloven-score [app_link]` → Runs Task D, posts JSON to thread
- `/gloven-content` → Posts week's content calendar
- `/gloven-experiments` → Shows ICE-scored experiment backlog

**Implementation (pseudo-code):**
```python
@app.command("/gloven-score")
def score_application(app_link):
    # Fetch application data
    app_data = fetch_app(app_link)
    
    # Call AI with Task D prompt
    score = ai_client.complete(
        system=GROWTH_OS_PROMPT,
        user=TASK_D_PROMPT.format(app=app_data)
    )
    
    # Post to Slack
    slack.post_message(
        channel=context.channel,
        text=f"Application scored: {score['decision']}",
        attachments=[{"text": json.dumps(score, indent=2)}]
    )
```

---

## 7. Demo Day Coordination

### Investor Outreach Pipeline

**From Task G (Investor Targeting):**

1. **Target list → Airtable:**
   - Columns: Firm, Contact, Priority, Intro Path, Status
   - Views: By Priority (A/B/C), By Status (Not contacted, Intro sent, Meeting booked)

2. **Email templates → Streak/Mixmax:**
   - Template A: Intro request (import to email tool)
   - Template B: Cold outreach (import to email tool)
   - Track opens, clicks, replies

3. **Calendar automation:**
   - T-28: Send intro requests (Priority A)
   - T-21: Cold outreach (Priority B)
   - T-14: Reminder + calendar links
   - T-7: Final push

4. **Data room checklist → Notion:**
   - Each startup gets a page
   - Checklist template auto-applied
   - Status tracked in dashboard

---

## 8. Content Repurposing

### Single AI Output → Multi-Channel

**Example:** Blog post from Task B

1. **Original:** 800-word blog post
2. **Repurpose:**
   - `/thread` → Twitter thread (6-8 tweets)
   - `/linkedin-post` → LinkedIn summary (150 words)
   - Extract quotes → Instagram carousel (3-5 cards)
   - `/newsletter-draft` → Newsletter section
   - Key stats → LinkedIn/Twitter images (Canva template)

**Tools:**
- **Repurpose.io:** Auto-cross-post
- **Canva:** Quote cards with brand colors
- **Descript:** Audio version for podcast clips

---

## 9. A/B Testing Workflow

### Landing Page Variants

**From Task E or `/LP-A/B`:**

1. AI generates 3 variants → Export HTML
2. **Unbounce/Instapage setup:**
   - Create 3 landing page variants
   - Split traffic 33/33/33
3. **Track in Google Analytics:**
   - Goal: Application starts
   - Metric: Conversion rate
4. **Run for 2 weeks or 300 visitors each**
5. **Winner → Update main site**

**Statistical significance calculator:**
```
https://abtestguide.com/calc/
```

---

## 10. Quality Control Loop

### Human-in-the-Loop Process

**Application Scoring:**
```
AI scores (Task D) → Threshold filter → Human review
├─ Score ≥ 80: Auto-advance to interview
├─ Score 60-79: Human review required
└─ Score < 60: Auto-reject with feedback option
```

**Content Publishing:**
```
AI draft → Editor review → Designer adds visuals → Legal review (if needed) → Schedule
```

**Budget Proposals:**
```
AI budget (Task A) → Finance review → Adjust → Approval → Track actuals
```

---

## Integration Checklist

Before going live, verify:

- [ ] System prompt loaded into all team members' AI tools
- [ ] CSV/JSON schemas match CRM fields
- [ ] Email templates comply with anti-spam laws (CAN-SPAM, GDPR)
- [ ] Analytics goals configured
- [ ] Slack webhooks tested
- [ ] A/B test sample sizes calculated
- [ ] Human review thresholds defined
- [ ] Backup process for AI downtime
- [ ] Version control for prompt iterations
- [ ] Access controls for sensitive prompts (application scoring)

---

## Cost Monitoring

### AI Usage Tracking

**Estimate monthly costs:**

| Task | Frequency | Tokens/Request | Cost/Month |
|------|-----------|----------------|------------|
| Application scoring | 300 apps | ~2k tokens | $15-30 |
| Content calendar | 1×/month | ~5k tokens | $2-5 |
| Daily social posts | 30×/month | ~1k tokens | $10-20 |
| Newsletter drafts | 4×/month | ~2k tokens | $2-5 |
| **Total** | | | **~$30-60** |

**Cost per acquired founder:** $0.10-0.20

---

## Maintenance

### Monthly Reviews

1. **Prompt performance audit:**
   - Which tasks are used most?
   - Which outputs need heavy editing?
   - Update system prompt based on learnings

2. **Output quality check:**
   - Sample 10 AI-generated pieces
   - Score on brand voice, accuracy, usefulness
   - Retrain/refine prompts as needed

3. **Integration health:**
   - Are automations running smoothly?
   - Any broken webhooks?
   - Update integrations for new tools

---

**Questions?** See [`example_usage.md`](example_usage.md) for workflow demos or [`README.md`](README.md) for system overview.
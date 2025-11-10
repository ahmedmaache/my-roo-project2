# Micro-Prompts — One-Liners for Speed

Quick prompts you can use with the Growth OS system prompt for common tasks. Copy/paste as User messages.

---

## Content & Social

### `/thread`
```
Draft a 6-tweet thread explaining why Gloven is non-dilutive, with 1 founder story and a clear 'Apply' CTA. Include alt-text for any images.
```

### `/linkedin-post`
```
Write a 150-word LinkedIn post about [topic] with a founder-friendly hook, 3 bullet points, and an application CTA. Make it skimmable.
```

### `/blog-outline`
```
Create an outline for a 1,000-word blog post titled "[Title]" targeting pre-seed founders. Include H2s, key points, and SEO keywords.
```

### `/newsletter-draft`
```
Draft a 400-word weekly newsletter with: 1 founder tip, 1 mentor spotlight, 1 program update, and an application reminder. Subject line + preview text included.
```

### `/case-study`
```
Write a 600-word founder case study for [Startup Name] covering: problem, solution, Gloven impact, and current traction. Include 2 pull quotes.
```

---

## Outreach & Email

### `/mentor-DM`
```
Write a 120-word DM to a [role] mentor in [region] about light-touch mentoring (1-2×/month). Include a value proposition and a short ask.
```

### `/partner-email`
```
Draft a 150-word partner outreach email proposing founder perks (credits/discounts) for [Product Category]. Personalize to [Company Name].
```

### `/intro-request`
```
Write a double opt-in intro request email connecting [Investor/Mentor Name] to Gloven. Keep it ≤100 words with a specific ask.
```

### `/follow-up`
```
Draft a 60-word follow-up email for [previous outreach context]. Gentle reminder with new angle or data point.
```

---

## Landing Page & Website

### `/LP-A/B`
```
Give 3 headline/subhead variants for Gloven's landing hero; include a testable hypothesis and a measurement plan for each.
```

### `/hero-copy`
```
Write above-the-fold copy for [specific page]: H1, 2-line subhead, 2 CTAs. Tone: warm, founder-first, globally accessible.
```

### `/value-props`
```
Create 5 value proposition bullets for Gloven targeting [specific founder persona]. Each bullet: benefit + proof point in ≤20 words.
```

### `/FAQ-tighten`
```
Tighten this FAQ to be globally understandable at CEFR B2 and remove jargon: [paste FAQ text].
```

---

## Ads & Promotion

### `/ad-concepts`
```
Produce 5 founder-friendly ad concepts for LinkedIn and X with hooks, copy (≤90 chars for X), and landing page angle. Include targeting suggestions.
```

### `/ad-variants`
```
Create 3 A/B test variants for this ad: [paste ad]. Test different hooks, CTAs, and value props. Include hypothesis for each.
```

### `/retargeting-copy`
```
Write 3 retargeting ad variants for founders who visited the application page but didn't apply. Address common objections.
```

---

## Scoring & Analysis

### `/quick-score`
```
Score this application using Gloven rubric. Return just the weighted total (0-100) and GO/NO_GO/WAITLIST decision with 1-sentence reasoning: [paste brief app summary].
```

### `/compare-apps`
```
Compare these 2 applications side-by-side using the rubric: [App A summary] vs [App B summary]. Which is stronger and why?
```

### `/red-flag-check`
```
Review this application for red flags (ethics, harassment, unlawful activity, unsafe claims, dishonesty): [paste app data]. Return only red flags or "None detected."
```

---

## Planning & Strategy

### `/sprint-plan`
```
Create a 1-week sprint plan to [specific goal]. Include daily tasks, owners, and success metrics. Output as a Markdown table.
```

### `/okr-draft`
```
Draft Q[#] OKRs for [workstream]. Format: 1 Objective with 3 Key Results. Each KR must be measurable and time-bound.
```

### `/experiment-idea`
```
Generate 5 low-cost growth experiments to [specific goal]. Format: Hypothesis, Channel, Setup (3 steps), Success Metric, ICE score.
```

### `/channel-audit`
```
Analyze our current channels [list channels and metrics]. Recommend: keep, optimize, or kill. Include rationale and next steps.
```

---

## PR & Communications

### `/press-angle`
```
Generate 5 newsworthy angles for Gloven's [event/milestone]. Match each to a media outlet type (tech, business, vertical, diversity-focused).
```

### `/quote-draft`
```
Write 3 quote options for [Spokesperson Name] about [news/event]. Each quote: 2-3 sentences, human tone, includes a stat or specific detail.
```

### `/crisis-response`
```
Draft a response to [issue/complaint] that: acknowledges concern, states facts, explains action, maintains brand voice. ≤200 words.
```

---

## Internal Ops

### `/doc-summary`
```
Summarize this document in 5 bullet points for a weekly update: [paste content]. Focus on decisions, metrics, and next steps.
```

### `/meeting-agenda`
```
Create a 60-minute meeting agenda for [meeting purpose] with: objectives, topics (time-boxed), discussion questions, and decisions needed.
```

### `/checklist`
```
Generate a pre-launch checklist for [event/milestone] with 15-20 items. Group by category (marketing, ops, tech, legal). Include owners.
```

---

## Usage Tips

1. **Chain micro-prompts**: Run `/blog-outline` → review → then `/case-study` with the outline
2. **Customize on the fly**: Add context like region, deadline, or specific constraints
3. **Save favorites**: Keep a personal library of your most-used variants
4. **Combine with tasks**: Use micro-prompts for quick iterations within larger Task prompts

---

**Example chained workflow:**

```
User: /thread
AI: [Returns thread]
User: /ad-concepts using tweet #3 from that thread
AI: [Returns 5 ad concepts based on thread content]
User: /LP-A/B using the hook from ad concept #2
AI: [Returns 3 landing page variants]
```

This creates a rapid iteration cycle without leaving your LLM interface.
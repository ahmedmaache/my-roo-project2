# Task D: Application Scoring — Structured Review Using Gloven Rubric

**Copy this entire prompt and paste as the USER message (after setting the System prompt to Growth OS).**

---

## TASK

Score this startup application using Gloven's rubric and recommend Go/No-Go.

## INPUT

**Paste the application data below:**

```
[Insert application answers or summary here]

Example fields:
- Startup name, one-liner, website
- Founders (names, roles, backgrounds)
- Problem statement
- Solution/product
- Traction metrics
- Business model
- Team background
- Why Gloven / what you need
```

## OUTPUT_FORMAT

JSON in a code fence following this schema:

```json
{
  "startup_name": "string",
  "team": {
    "score": 1-5,
    "evidence": "Concise quote or observation",
    "strengths": ["bullet 1", "bullet 2"],
    "concerns": ["bullet 1"]
  },
  "problem_size": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "insight": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "traction": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "timing": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "fit": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "impact": {
    "score": 1-5,
    "evidence": "string",
    "strengths": ["..."],
    "concerns": ["..."]
  },
  "weighted_total_0to100": 0-100,
  "decision": "GO" | "NO_GO" | "WAITLIST",
  "red_flags": ["flag 1", "flag 2"] or [],
  "followup_questions": ["question 1", "question 2", "question 3"],
  "summary": "3–5 sentence human-readable assessment with recommendation"
}
```

## SCORING GUIDE

Use Gloven's rubric (scale 1–5):
- **Team (25%)**: Drive, skill complement, learning speed, full-time commitment
- **Problem size (20%)**: Market TAM, urgency, pain intensity
- **Insight (15%)**: Unique solution angle, unfair advantage, defensibility
- **Traction (15%)**: Early validation, metrics, customer feedback
- **Timing (10%)**: Tech/regulatory tailwinds, "why now" strength
- **Fit (10%)**: Alignment with Gloven mission and program structure
- **Impact (5%)**: Diversity dimensions, ecosystem contribution

**Pass bar:** 3.6 weighted average (0–100 scale: 72+) AND no critical red flags.

**Score meanings:**
- `1` = Vague, no evidence
- `2` = Early but weak
- `3` = Plausible, decent foundation
- `4` = Strong signals, clear momentum
- `5` = Exceptional, obvious strength

## RED FLAGS (auto-reject)

- Ethics violations
- Harassment or discriminatory practices
- Unlawful activity
- Unsafe product claims (health/finance without credentials)
- Misrepresentation or dishonesty
- Significant founder conflicts

## QUALITY CHECK

Before finalizing, ensure:
- ✅ All scores justified with specific evidence
- ✅ Strengths and concerns are concrete (not generic)
- ✅ Follow-up questions are actionable
- ✅ Summary is founder-respectful and clear
- ✅ Decision aligns with weighted score and pass bar
- ✅ Red flags are serious blockers only

## EXAMPLE OUTPUT

```json
{
  "startup_name": "Example AI Co",
  "team": {
    "score": 4,
    "evidence": "Technical co-founder with ML PhD, 3 years at Google Brain; business co-founder with 2 exits",
    "strengths": ["Deep domain expertise", "Proven track record"],
    "concerns": ["No full-time designer yet"]
  },
  "weighted_total_0to100": 76,
  "decision": "GO",
  "red_flags": [],
  "followup_questions": [
    "What's your runway and burn rate?",
    "How will you acquire first 100 customers?",
    "When can you commit full-time?"
  ],
  "summary": "Strong technical team with clear market insight. Early traction validates problem. Recommend GO with follow-up on GTM strategy."
}
```

---

**Paste application data above and submit to your LLM.**
# Growth Plan Snapshot Template

Use this Markdown table format for tracking growth workstreams and OKRs.

## Format

```markdown
| Workstream | Objective | KPI | Baseline | Target | Owner | Start | End | Status | Notes |
|------------|-----------|-----|----------|--------|-------|-------|-----|--------|-------|
```

## Column Definitions

- **Workstream**: High-level initiative (e.g., "Founder Acquisition", "Content Engine", "Partner Development")
- **Objective**: Specific goal statement (SMART format)
- **KPI**: Measurable metric (e.g., "Qualified applications", "Newsletter subscribers", "Mentor sessions booked")
- **Baseline**: Starting value (numeric)
- **Target**: Goal value (numeric with timeline)
- **Owner**: Person responsible (first name or role)
- **Start**: Start date (YYYY-MM-DD)
- **End**: End date (YYYY-MM-DD)
- **Status**: `Not Started` | `In Progress` | `On Track` | `At Risk` | `Completed` | `Blocked`
- **Notes**: Brief status update or blockers

## Example

| Workstream | Objective | KPI | Baseline | Target | Owner | Start | End | Status | Notes |
|------------|-----------|-----|----------|--------|-------|-------|-----|--------|-------|
| Founder Acquisition | Drive qualified applications for Cohort 01 | Qualified apps | 0 | 300 by 2026-03-01 | Sarah | 2025-12-01 | 2026-03-01 | In Progress | 50 apps in week 1, trending well |
| Content Engine | Build awareness via founder stories | Blog readers | 0 | 5,000 monthly | Alex | 2025-12-01 | 2026-02-28 | On Track | Published 8 stories, avg 600 reads |
| Mentor Network | Activate mentor mesh for sessions | Mentor sessions | 0 | 80 sessions (40 mentors × 2/mo) | Jordan | 2025-12-15 | 2026-02-28 | At Risk | Only 25 mentors onboarded so far |
| Partner Perks | Secure founder perks portfolio | Partner deals | 0 | 15 partners, $100k credits | Taylor | 2026-01-01 | 2026-02-15 | Not Started | Outreach list ready |

## Weekly Update Format

When updating this table weekly, change:
1. **Status** column (reflect current state)
2. **Notes** column (latest blocker or win)
3. Add **actual vs target** in Notes if significantly off track

## Integration

**Airtable/Notion**: Copy table as CSV, import to base, link to dashboards  
**Google Sheets**: Paste table, use conditional formatting for Status  
**Jira/Linear**: Convert each row to an Epic with KPI as success metric

## Export Commands

**To CSV**:
```bash
# Copy table → Open Google Sheets → Paste → Download as CSV
```

**To JSON** (for automation):
```json
[
  {
    "workstream": "Founder Acquisition",
    "objective": "Drive qualified applications for Cohort 01",
    "kpi": "Qualified apps",
    "baseline": 0,
    "target": "300 by 2026-03-01",
    "owner": "Sarah",
    "start": "2025-12-01",
    "end": "2026-03-01",
    "status": "In Progress",
    "notes": "50 apps in week 1, trending well"
  }
]
```

---

**Use this template when requesting growth plans from the AI. It ensures consistent, trackable outputs.**
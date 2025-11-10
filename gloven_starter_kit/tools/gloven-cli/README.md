# Gloven CLI

AI-powered growth automation CLI for Gloven accelerator. Generate growth plans, editorial calendars, partner lists, and score applications using LLM-powered prompts.

## Features

- 🚀 **Growth Plans**: Generate 30/60/90 day founder acquisition strategies
- 📅 **Editorial Calendars**: Create content calendars with ready-to-publish samples
- 🤝 **Partner Sourcing**: Build mentor and partner target lists with outreach templates
- 🔄 **Batch Scoring**: Score multiple applications efficiently with concurrency control
- 🏥 **Health Monitoring**: Check system health and API readiness
- 📈 **Weekly Reports**: Generate operational health reports with cost tracking
- 📊 **Application Scoring**: Score startup applications using Gloven's rubric

## Quick Start

### Installation

```bash
cd gloven_starter_kit/tools/gloven-cli
npm install
npm run build
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Set your API keys in `.env`:
```env
PROVIDER=openai
OPENAI_API_KEY=your_key_here
MODEL=gpt-4o-mini
DRY_RUN=false
```

**Supported Providers:**
- `openai` - OpenAI (GPT-4, GPT-4o, GPT-3.5)
- `anthropic` - Anthropic (Claude)
- `openrouter` - OpenRouter (access to multiple models)

### DRY-RUN Mode

**Zero-cost development mode** - perfect for testing without API calls:

```bash
DRY_RUN=true node dist/index.js score --input ../../data/apps/sample_application.json --out ../../out/score.json
```

DRY-RUN mode returns schema-valid placeholder data. Great for:
- Testing the CLI without API costs
- CI/CD pipelines
- Development and debugging

## Commands

### 1. Generate Growth Plan

Create a 30/60/90 day founder acquisition plan with KPIs, channels, experiments, and budget breakdown.

```bash
node dist/index.js plan \
  --regions "EMEA,LATAM" \
  --budget 8000 \
  --target 300 \
  --days 90 \
  --out ../../out/plan.md
```

**Parameters:**
- `--regions`: Target geographic regions
- `--budget`: Monthly budget in USD
- `--target`: Target number of applications
- `--days`: Timeline in days
- `--out`: Output file path

**Output:** Markdown file with TL;DR, KPIs, channels, calendar, experiments (ICE scores), budget breakdown, and risk mitigation.

---

### 2. Generate Editorial Calendar

Create a multi-week content calendar with ready-to-publish samples.

```bash
node dist/index.js calendar \
  --weeks 6 \
  --out ../../out/editorial_calendar.md
```

**Parameters:**
- `--weeks`: Number of weeks to plan
- `--out`: Output file path

**Output:** Markdown file with:
- Editorial calendar table
- 3 sample drafts (LinkedIn, Twitter thread, blog post)
- Newsletter template

---

### 3. Generate Partner Lists

Build mentor and partner target lists with personalized outreach templates.

```bash
node dist/index.js partners \
  --domains "SaaS,AI/ML" \
  --mentors 40 \
  --partners 20 \
  --out ../../out/partners.md
```

**Parameters:**
- `--domains`: Focus domains (comma-separated)
- `--mentors`: Number of mentor targets
- `--partners`: Number of partner targets
- `--out`: Output file path

**Output:** Markdown file with:
- Mentor target list (CSV format)
- Partner target list (CSV format)
- 3 email templates (mentor invite, partner perk, workshop co-host)

---

### 4. Score Application

Score a startup application using Gloven's structured rubric.

```bash
node dist/index.js score \
  --input ../../data/apps/sample_application.json \
  --out ../../out/score.json
```

**Parameters:**
- `--input`: Path to application JSON file
- `--out`: Output file path (JSON)

**Output:** Two files:
- `score.json` - Structured JSON with scores, decision, red flags, and follow-up questions
- `score.md` - Human-readable summary

**Application JSON Format:**
```json
{
  "startup_name": "YourStartup",
  "one_liner": "What you do",
  "founders": [
    {
      "name": "Founder Name",
      "role": "CEO",
      "background": "Experience"
    }
  ],
  "location": "Berlin",
  "problem": "Problem you solve",
  "solution": "Your solution",
  "traction": "$10k MRR, 5 customers",
  "business_model": "SaaS subscription",
  "why_gloven": "Why you need Gloven"
}

---

### 5. Batch Score Applications

Score multiple applications efficiently with deduplication, concurrency control, and automated ranking.

```bash
node dist/index.js batch-score \
  --input ../../data/apps/applications.csv \
  --concurrency 3 \
  --out ../../out
```

**Parameters:**
- `--input`: Path to CSV file or directory of JSON files
- `--concurrency`: Number of concurrent scoring operations (default: 3)
- `--out`: Output directory (default: ../../out)
- `--dry-run`: Use DRY_RUN mode with deterministic placeholder scores

**CSV Format:**
```csv
id,founderName,email,company,region,stage,summary,links
app-001,Jane Doe,jane@startup.com,StartupCo,US,MVP,Description,https://startup.com
```

**Outputs:**
- `out/scores/<id>.json` - Individual score files
- `out/scores/<id>.md` - Human-readable summaries
- `out/scores.jsonl` - Aggregated scores for quick scanning
- `out/leaderboard.md` - Ranked list with emoji badges (🥇🥈🥉)
- `out/shortlist.csv` - GO decisions only
- `out/triage.md` - WAITLIST applications with follow-up questions
- `out/flags.md` - Applications with red flags
- `out/ledger/cost_YYYY-MM.jsonl` - Cost tracking

**Features:**
- Automatic deduplication by email or company name
- Deterministic DRY_RUN scores (same input → same output)
- Retry logic with exponential backoff
- Weighted scoring: Team(25%) + Problem(20%) + Insight(15%) + Traction(15%) + Timing(10%) + Fit(10%) + Impact(5%)
- Decision bands: GO (≥70), WAITLIST (60-69), NO_GO (<60)
- Red flags auto-assign NO_GO

---

### 6. Health Check

Check system health, API configuration, file permissions, and cost budget status.

```bash
node dist/index.js health
```

**Options:**
- `--json`: Output as JSON instead of pretty terminal format

**Exit Codes:**
- `0`: All checks passed
- `1`: Warnings present (system operational)
- `2`: Hard failures (action required)

**Checks Performed:**
- ✅ API key configuration
- ✅ File system permissions (prompt dir, output dir)
- ✅ CI environment detection
- ✅ Cost budget status (warns at 80%, fails at 100%)
- ✅ DRY_RUN mode detection

---

### 7. Generate Health Report

Generate comprehensive operational health report with intake stats, score distribution, and cost tracking.

```bash
node dist/index.js report --notify
```

**Options:**
- `--notify`: Send Slack notification (requires SLACK_WEBHOOK_URL)
- `--from <date>`: Start date (YYYY-MM-DD)
- `--to <date>`: End date (YYYY-MM-DD)

**Output:** `out/reports/gloven_health_report.md`

**Sections:**
- 📥 Intake summary (total apps, by region, by stage)
- 📊 Score distribution with ASCII sparkline
- 🏆 Top 10 performers with key strengths
- 🚩 Risks and red flags summary
- 💰 Cost tracking (month-to-date vs budget)
- 📋 Next week focus areas

**Slack Integration:**

Set `SLACK_WEBHOOK_URL` in `.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

The report will post a concise summary to Slack with KPIs and artifact links.
```

## Cost Management

### Token Estimation

The CLI estimates token usage and costs before making API calls:

```env
COST_PER_1K_INPUT=0.0015
COST_PER_1K_OUTPUT=0.002
```

Set these values to your model's actual costs for accurate estimates.

### Rate Limiting

Configure rate limiting to avoid hitting API limits:


### Cost Tracking & Observability

All LLM operations are logged to `out/ledger/cost_YYYY-MM.jsonl`:

```jsonl
{"timestamp":"2024-05-01T10:00:00Z","provider":"openai","model":"gpt-4o-mini","estTokensIn":1500,"estTokensOut":500,"estCostUSD":0.004,"runId":"uuid","cmd":"batch-score"}
```

**Query monthly costs:**
```bash
# Total monthly cost
cat out/ledger/cost_2024-05.jsonl | jq -s 'map(.estCostUSD) | add'

# Most expensive operations
cat out/ledger/cost_2024-05.jsonl | jq -s 'sort_by(.estCostUSD) | reverse | .[0:10]'

# Cost by command
cat out/ledger/cost_2024-05.jsonl | jq -s 'group_by(.cmd) | map({cmd: .[0].cmd, total: map(.estCostUSD) | add})'
```

### Budget Guards

Set soft budget limit in `.env`:
```env
COST_BUDGET_USD=50
```

The system will:
- **Warn at 80%**: Log warning but continue
- **Fail at 100%**: Exit with code 2 unless `--override` flag used

Check budget status:
```bash
node dist/index.js health
```

### Privacy & PII Redaction

All logs automatically redact PII:
- Email addresses
- Phone numbers  
- URLs (keeps protocol)
- API keys (long alphanumeric strings)

Force redaction:
```env
GLOVEN_LOG_PII=false
```

## SLOs & Runbooks

### Service Level Objectives

The CLI tracks against these SLOs (configurable in `gloven.config.yaml`):
- **Batch Success Rate**: ≥99%
- **Max Wallclock Time**: ≤30 minutes for typical batches

### Operational Runbooks

When issues occur, consult the runbooks:
- [Health Runbook](../../ops/runbooks/health_runbook.md) - Diagnose alerts, remediation steps
- [Batch Scoring Runbook](../../ops/runbooks/batch_scoring_runbook.md) - Pipeline steps, failure modes

**Common scenarios:**
- Cost budget exceeded → [Health Runbook: Cost Budget Exceeded](../../ops/runbooks/health_runbook.md#1-cost-budget-exceeded)
- Schema validation errors → [Batch Runbook: Schema Validation Failure](../../ops/runbooks/batch_scoring_runbook.md#1-schema-validation-failure)
- Rate limits → [Batch Runbook: Rate Limit Hit](../../ops/runbooks/batch_scoring_runbook.md#2-rate-limit-hit-429-errors)
```env
RATE_LIMIT_RPS=2
```

### Cost Guardrails

The CLI includes built-in guardrails:
- Token estimation before calls
- DRY_RUN fallback when no API key is set
- Maximum request limits (configurable in `gloven.config.yaml`)

## Configuration Files

### `.env` (Environment Variables)

```env
PROVIDER=openai
OPENAI_API_KEY=sk-...
MODEL=gpt-4o-mini
DRY_RUN=false
MAX_OUTPUT_TOKENS=2000
COST_PER_1K_INPUT=0.00
COST_PER_1K_OUTPUT=0.00
```

### `gloven.config.yaml` (Project Defaults)

```yaml
provider: openai
model: gpt-4o-mini
outDir: ../../out
promptDir: ../../ai_prompts
locale: global
guardrails:
  maxRequests: 8
  dryRunFallback: true
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite validates:
- DRY-RUN mode returns schema-valid data
- Output files are created correctly
- JSON outputs pass Zod validation
- Required sections are present in markdown outputs

## CI/CD Integration

### GitHub Actions

The CLI includes a GitHub Action workflow that automatically scores applications when they're added to `data/apps/*.json`.

See [`.github/workflows/gloven-score.yml`](../../.github/workflows/gloven-score.yml) for the complete workflow.

**Workflow triggers:**
- On PRs modifying `data/apps/*.json`
- Runs in DRY-RUN mode (no API costs)
- Uploads scores as artifacts
- Comments PR with summary

## Troubleshooting

### "No API key found"

**Solution:** Set your API key in `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

Or use DRY-RUN mode:
```bash
DRY_RUN=true node dist/index.js [command]
```

---

### "Failed to load system prompt"

**Solution:** Ensure you're running from the correct directory:
```bash
cd gloven_starter_kit/tools/gloven-cli
node dist/index.js [command]
```

The CLI expects prompts at `../../ai_prompts/` relative to the CLI directory.

---

### "Validation error: expected object"

**Solution:** 
1. Check your input JSON is valid
2. Ensure it matches the expected schema
3. Try DRY-RUN mode first to test the flow

---

### Build errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

### TypeScript errors

**Solution:** Make sure you're using Node.js 20+:
```bash
node --version  # Should be v20.x or higher
```

## Development

### File Structure

```
gloven-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config.ts             # Configuration loader
│   ├── promptLoader.ts       # Prompt file management
│   ├── zodSchemas.ts         # Validation schemas
│   ├── providers/            # LLM provider implementations
│   │   ├── base.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   └── openrouter.ts
│   ├── generators/           # Command implementations
│   │   ├── plan.ts
│   │   ├── calendar.ts
│   │   ├── partners.ts
│   │   └── score.ts
│   └── util/                 # Helper utilities
│       ├── fs.ts
│       └── costGuard.ts
├── test/                     # Test files
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Commands

1. Create generator in `src/generators/`
2. Add command to `src/index.ts`
3. Add task prompt mapping to `src/promptLoader.ts`
4. Create corresponding task prompt in `ai_prompts/task_prompts/`
5. Add tests in `test/`

### Code Style

Format code with Prettier:
```bash
npm run format
```

Check formatting:
```bash
npm run lint
```

### Updated Examples

```bash
# 1. Check system health first
DRY_RUN=true node dist/index.js health

# 2. Batch score applications
DRY_RUN=true node dist/index.js batch-score \
  --input ../../data/apps/applications.csv \
  --concurrency 2 \
  --out ../../out

# 3. Generate health report with Slack notification
DRY_RUN=true node dist/index.js report --notify

# 4. Single application score
DRY_RUN=true node dist/index.js score \
  --input ../../data/apps/sample_application.json \
  --out ../../out/score.json

# 5. Generate growth plan
DRY_RUN=true node dist/index.js plan \
  --regions "Global" \
  --budget 10000 \
  --target 500 \
  --days 90 \
  --out ../../out/plan.md

# 6. Build partner lists
DRY_RUN=true node dist/index.js partners \
  --domains "SaaS,AI/ML,FinTech" \
  --mentors 50 \
  --partners 25 \
  --out ../../out/partners.md
```

### Production Batch Scoring

```bash
# Weekly batch processing (production)
PROVIDER=openai \
OPENAI_API_KEY=$YOUR_KEY \
COST_BUDGET_USD=100 \
node dist/index.js batch-score \
  --input ../../data/apps/weekly_batch.csv \
  --concurrency 3 \
  --out ../../out

# Generate and send report to Slack
SLACK_WEBHOOK_URL=$YOUR_WEBHOOK \
node dist/index.js report --notify
```

## Examples

### Complete Workflow

```bash
# 1. Score applications
DRY_RUN=true node dist/index.js score \
  --input ../../data/apps/sample_application.json \
  --out ../../out/score.json

# 2. Generate growth plan
DRY_RUN=true node dist/index.js plan \
  --regions "Global" \
  --budget 10000 \
  --target 500 \
  --days 90 \
  --out ../../out/plan.md

# 3. Create content calendar
DRY_RUN=true node dist/index.js calendar \
  --weeks 8 \
  --out ../../out/calendar.md

# 4. Build partner lists
DRY_RUN=true node dist/index.js partners \
  --domains "SaaS,AI/ML,FinTech" \
  --mentors 50 \
  --partners 25 \
  --out ../../out/partners.md
```

All outputs will be in `gloven_starter_kit/out/`.

## License

MIT

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [AI Prompts Documentation](../../ai_prompts/README.md)
- Check existing [GitHub Issues](../../issues)
# Batch Scoring Pipeline Runbook

This runbook covers the batch scoring pipeline, from ingestion through export.

## Pipeline Overview

```
Input (CSV/JSON) 
  ↓
[1] Ingestion & Deduplication
  ↓
[2] Parallel Scoring (with retry)
  ↓
[3] Ranking & Banding
  ↓
[4] Export (leaderboard, shortlist, triage, flags)
```

## Normal Operation

### Running Batch Scoring

```bash
cd gloven_starter_kit/tools/gloven-cli

# Standard batch with default settings
gloven batch-score --input ../../data/apps/applications.csv

# With custom concurrency and output
gloven batch-score \
  --input ../../data/apps/applications.csv \
  --concurrency 2 \
  --out ../../out

# DRY_RUN mode for testing
DRY_RUN=true gloven batch-score \
  --input ../../data/apps/applications.csv
```

### Expected Outputs

After successful run, check:

1. **Individual scores:** `out/scores/<app-id>.json` and `.md`
2. **Aggregated data:** `out/scores.jsonl`
3. **Reports:**
   - `out/leaderboard.md` - All apps ranked
   - `out/shortlist.csv` - GO decisions only
   - `out/triage.md` - WAITLIST with follow-ups
   - `out/flags.md` - Red flag summary
4. **Cost ledger:** `out/ledger/cost_YYYY-MM.jsonl`

### Success Criteria

- ✅ All applications scored (or near 100% success rate)
- ✅ Deduplication detected and logged
- ✅ Rankings calculated correctly
- ✅ All export files generated
- ✅ Cost logged to ledger

## Failure Modes

### 1. Schema Validation Failure

**Symptom:**
```
❌ Error: Failed to validate score after retry
Schema validation error: ...
```

**Root Causes:**
- LLM returned invalid JSON
- Missing required fields
- Wrong data types
- Schema has evolved

**Diagnosis:**
1. Check raw LLM output:
   ```bash
   cat out/raw/<app-id>.txt
   ```
2. Validate against schema:
   ```bash
   cat out/scores/<app-id>.json | jq .
   ```
3. Review zodSchemas.ts for mismatches

**Recovery:**
1. **One-off issue:**
   - Re-run for that specific app
   - Check if prompt was ambiguous
2. **Systematic issue:**
   - Update schema in `zodSchemas.ts`
   - Adjust prompt to be more specific
   - Review examples in prompt
3. **Temporary:**
   - Retry with exponential backoff (already implemented)
   - Use DRY_RUN to validate pipeline

**Prevention:**
- Keep schema in sync with prompts
- Add schema validation to tests
- Use strict mode in Zod parsing

### 2. Rate Limit Hit (429 Errors)

**Symptom:**
```
⚠️  Scoring failed: 429 Too Many Requests
Retrying in X seconds...
```

**Root Causes:**
- Concurrency too high
- API quota exceeded
- Burst limit hit

**Diagnosis:**
1. Check provider rate limits:
   - OpenAI: Tier-dependent (RPM/TPM)
   - Anthropic: Check dashboard
2. Review RATE_LIMIT_RPS setting
3. Check concurrency setting

**Recovery:**
1. **Immediate:**
   - Reduce `--concurrency` to 1
   - Wait for rate limit reset (usually 60s)
   - Use exponential backoff (automatic)
2. **Short-term:**
   - Adjust RATE_LIMIT_RPS in config
   - Spread load over time
   - Request rate limit increase from provider
3. **Long-term:**
   - Implement token bucket rate limiter
   - Queue-based processing
   - Multiple API keys with load balancing

**Prevention:**
- Start with concurrency=1, increase gradually
- Monitor rate limit headers
- Set up alerts for 429 responses

### 3. Deduplication Issues

**Symptom:**
```
⚠️  Found 0 duplicates (expected more)
```
or
```
❌ Duplicate not detected: same email/company scored twice
```

**Root Causes:**
- Case sensitivity mismatch
- Whitespace differences
- Typos in source data
- Logic error in deduplication

**Diagnosis:**
1. Check source CSV:
   ```bash
   cat data/apps/applications.csv | grep -i "email@example.com"
   ```
2. Review normalization in appIngest.ts
3. Test with known duplicates

**Recovery:**
1. **Data quality:**
   - Clean source CSV (trim, lowercase)
   - Fix typos manually
   - Re-run ingestion
2. **Logic fix:**
   - Update appIngest.ts deduplication logic
   - Consider fuzzy matching for company names
   - Add unit tests for edge cases

**Prevention:**
- Validate CSV before batch scoring
- Use canonical email format (lowercase)
- Log all deduplication decisions

### 4. Network/Timeout Issues

**Symptom:**
```
❌ Error: Request timeout
❌ Error: Connection reset
```

**Root Causes:**
- Provider API downtime
- Network instability
- Slow responses (large prompts)

**Diagnosis:**
1. Check provider status:
   - https://status.openai.com/
   - https://status.anthropic.com/
2. Test connectivity:
   ```bash
   curl -I https://api.openai.com/v1/models
   ```
3. Review prompt size (token count)

**Recovery:**
1. **Immediate:**
   - Wait and retry (automatic backoff)
   - Use DRY_RUN to test workflow
   - Switch to backup provider if available
2. **Persistent:**
   - Increase timeout in provider client
   - Reduce prompt size
   - Contact provider support

**Prevention:**
- Implement health checks before batch
- Set up provider status monitoring
- Have fallback provider configured

### 5. Memory/Resource Exhaustion

**Symptom:**
```
Error: JavaScript heap out of memory
Process killed
```

**Root Causes:**
- Too many concurrent operations
- Large batch size
- Memory leak in code

**Diagnosis:**
1. Check batch size and concurrency
2. Monitor memory usage:
   ```bash
   node --max-old-space-size=4096 dist/index.js batch-score ...
   ```
3. Profile memory usage

**Recovery:**
1. **Immediate:**
   - Reduce concurrency to 1
   - Split batch into smaller chunks
   - Restart process
2. **Configuration:**
   - Increase Node.js heap size
   - Process in smaller batches (100-500 apps)
   - Use streaming where possible

**Prevention:**
- Set reasonable batch size limits
- Monitor memory in production
- Implement batch size warnings

## Advanced Troubleshooting

### Debugging Individual App Failures

```bash
# Extract failed app IDs from logs
grep "❌" batch.log | grep -oP 'app-\d+'

# Re-score individually with verbose logging
DEBUG=true gloven score \
  --input data/apps/<app-id>.json \
  --out out/scores/<app-id>.json
```

### Inspecting Cost Patterns

```bash
# Total cost this month
cat out/ledger/cost_2024-*.jsonl | jq -s 'map(.estCostUSD) | add'

# Most expensive operations
cat out/ledger/cost_2024-*.jsonl | jq -s 'sort_by(.estCostUSD) | reverse | .[0:10]'

# Cost by command
cat out/ledger/cost_2024-*.jsonl | jq -s 'group_by(.cmd) | map({cmd: .[0].cmd, total: map(.estCostUSD) | add})'
```

### Re-processing Failed Applications

```bash
# Get list of apps without scores
comm -23 \
  <(ls data/apps/*.json | xargs -n1 basename | sort) \
  <(ls out/scores/*.json | xargs -n1 basename | sort)

# Re-run batch for failed apps only
gloven batch-score --input data/apps/failed/ --concurrency 1
```

## Performance Tuning

### Optimal Concurrency

- **Start:** concurrency=1
- **Low rate limit:** concurrency=2
- **Standard tier:** concurrency=3
- **High tier:** concurrency=5-10

Monitor success rate. If < 99%, reduce concurrency.

### Batch Size Guidelines

- **Development:** 5-10 apps
- **Testing:** 50-100 apps
- **Production:** 200-500 apps per batch
- **Large scale:** Use queue system

### Cost Optimization

1. **Use cheaper models:**
   - Development: gpt-4o-mini
   - Production: gpt-4o-mini or claude-haiku
2. **Reduce prompt size:**
   - Remove examples if accuracy allows
   - Use references instead of full text
3. **Cache common operations:**
   - System prompt loading
   - Schema validation

## Monitoring & Alerts

### Key Metrics

- **Success rate:** Should be ≥99%
- **Average processing time:** Track per app
- **Cost per app:** Monitor trends
- **Deduplication rate:** Baseline ~5-10%

### Recommended Alerts

1. **Critical:**
   - Success rate < 95%
   - Batch fails completely
   - Cost > 150% of budget

2. **Warning:**
   - Success rate < 99%
   - Processing time > 2x baseline
   - Cost > 80% of budget

3. **Info:**
   - Deduplication rate anomaly
   - New error types
   - Slow individual apps

## Maintenance Tasks

### Weekly

- Review cost ledger
- Check for failed applications
- Archive old raw outputs (> 30 days)

### Monthly

- Archive cost ledgers (> 6 months)
- Review and update budgets
- Analyze performance trends

### Quarterly

- Update schemas if needed
- Review and optimize prompts
- Benchmark against baselines

## Related Documentation

- [Health Runbook](./health_runbook.md)
- [Gloven CLI README](../../tools/gloven-cli/README.md)
- [Application Score Schema](../../ai_prompts/output_contracts/application_score_schema.json)
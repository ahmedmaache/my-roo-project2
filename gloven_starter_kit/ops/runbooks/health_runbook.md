# Gloven Health Runbook

This runbook provides diagnostic steps and remediation actions for common health check alerts.

## Table of Contents
- [Quick Reference](#quick-reference)
- [Alert Categories](#alert-categories)
- [Common Issues](#common-issues)
- [Escalation](#escalation)

## Quick Reference

**Run health check:**
```bash
cd gloven_starter_kit/tools/gloven-cli
node dist/index.js health
```

**Exit codes:**
- `0` = All checks passed
- `1` = Warnings present, system operational
- `2` = Hard failures, action required

## Alert Categories

### 1. Cost Budget Exceeded

**Alert:** Monthly cost ≥ soft budget limit

**Symptoms:**
- Exit code: 2
- Message: "Cost budget exceeded: $X / $Y (Z%)"

**Diagnosis:**
1. Check cost ledger:
   ```bash
   cat gloven_starter_kit/out/ledger/cost_YYYY-MM.jsonl
   ```
2. Identify high-cost operations using `jq`:
   ```bash
   cat gloven_starter_kit/out/ledger/cost_YYYY-MM.jsonl | jq -s 'sort_by(.estCostUSD) | reverse | .[0:10]'
   ```
3. Review which commands are driving costs

**Actions:**
- **Immediate:**
  - Use `--override` flag if expense is justified and approved
  - Switch to DRY_RUN mode for testing: `DRY_RUN=true`
- **Short-term:**
  - Reduce batch `--concurrency` (e.g., from 3 to 1)
  - Use cheaper model in config (e.g., gpt-4o-mini instead of gpt-4)
  - Implement sampling: process subset of applications
- **Long-term:**
  - Request budget increase if needed for production workload
  - Optimize prompts to reduce token usage
  - Review rate limits and caching strategies

**Prevention:**
- Monitor costs weekly via `gloven report`
- Set budget alerts at 50%, 80%, 100%
- Use DRY_RUN by default in CI/CD

### 2. API Key Not Configured

**Alert:** No API key found for selected provider

**Symptoms:**
- Exit code: 2 (unless DRY_RUN=true)
- Message: "No API key configured for provider: X"

**Diagnosis:**
1. Check environment variables:
   ```bash
   echo $OPENAI_API_KEY
   echo $ANTHROPIC_API_KEY
   echo $OPENROUTER_API_KEY
   ```
2. Verify `.env` file exists and is loaded
3. Check provider setting matches available key

**Actions:**
- **In development:**
  - Set appropriate env var: `export OPENAI_API_KEY=sk-...`
  - Or use DRY_RUN mode: `DRY_RUN=true`
- **In CI:**
  - Add secret to GitHub Actions: Settings → Secrets → Actions
  - Ensure secret name matches expected env var
  - Or run with `DRY_RUN=true` for testing
- **Provider mismatch:**
  - Change provider in `gloven.config.yaml` to match available key
  - Or set `PROVIDER=openai` environment variable

**Prevention:**
- Document required env vars in team wiki
- Use `.env.example` as template for new contributors
- Implement pre-commit hook to warn about missing keys

### 3. File System Errors

**Alert:** Output directory not writable or prompt directory missing

**Symptoms:**
- Exit code: 2
- Message: "Output directory is not writable: X" or "Prompt directory does not exist: Y"

**Diagnosis:**
1. Check directory permissions:
   ```bash
   ls -la gloven_starter_kit/out
   ls -la gloven_starter_kit/ai_prompts
   ```
2. Check disk space:
   ```bash
   df -h
   ```
3. Check for filesystem errors in CI logs

**Actions:**
- **Missing directories:**
  ```bash
  mkdir -p gloven_starter_kit/out/{scores,reports,ledger,raw}
  mkdir -p gloven_starter_kit/ai_prompts
  ```
- **Permission issues:**
  ```bash
  chmod -R u+w gloven_starter_kit/out
  ```
- **Disk full:**
  - Clean up old artifacts
  - Increase storage allocation
  - Archive cost ledgers older than 6 months
- **In CI:**
  - Ensure checkout@v4 has proper permissions
  - Verify runner has sufficient storage

**Prevention:**
- Include directory creation in setup scripts
- Monitor disk usage in CI runners
- Implement artifact retention policy (30 days)

### 4. SLO Miss - Batch Success Rate

**Alert:** Batch scoring success rate < 99%

**Symptoms:**
- Low success rate in batch operations
- Multiple scoring failures in logs

**Diagnosis:**
1. Review recent batch logs:
   ```bash
   gloven batch-score --input data/apps/applications.csv 2>&1 | tee batch.log
   ```
2. Check for patterns in failures:
   - Schema validation errors
   - API timeouts
   - Rate limiting (429 errors)
   - Network issues

**Actions:**
- **Schema validation failures:**
  - Check `out/raw/<id>.txt` for malformed responses
  - Update `zodSchemas.ts` if schema evolved
  - Retry with `--override` if one-off issue
- **Rate limiting:**
  - Reduce `--concurrency` (default 3 → 1)
  - Check provider status pages
  - Verify RATE_LIMIT_RPS setting
- **Network/timeout issues:**
  - Retry failed applications individually
  - Check provider availability
  - Increase timeout if needed

**Prevention:**
- Monitor batch jobs in production
- Implement exponential backoff (already in code)
- Set up alerts for success rate < 99%
- Test with sample data before large batches

### 5. SLO Miss - Batch Wallclock Time

**Alert:** Batch processing exceeds max_batch_wallclock_minutes (default: 30)

**Symptoms:**
- Batch jobs timing out
- Long-running operations in CI

**Diagnosis:**
1. Check batch size and concurrency
2. Review per-application processing time
3. Identify slow operations (scoring vs I/O)

**Actions:**
- **Immediate:**
  - Split large batches into smaller chunks
  - Increase concurrency if rate limits allow
  - Use DRY_RUN for testing workflow
- **Optimization:**
  - Profile slow operations
  - Cache prompt loading
  - Parallelize I/O operations
  - Consider async processing queue

**Prevention:**
- Set realistic SLO based on actual performance
- Monitor P95 processing times
- Implement batch size limits

## Common Issues

### Issue: Health check passes but commands fail

**Cause:** Health check only validates configuration, not runtime behavior

**Solution:**
- Run actual command with `--dry-run` flag
- Check logs for detailed error messages
- Verify network connectivity to LLM providers

### Issue: Cost budget warning at start of month

**Cause:** Previous month's ledger not archived

**Solution:**
- Cost ledger is per-month (cost_YYYY-MM.jsonl)
- No action needed - wait for month rollover
- Or manually archive: `mv cost_2024-05.jsonl archive/`

### Issue: Duplicate applications not detected

**Cause:** Normalization issues or typos in CSV

**Solution:**
- Check email and company name for whitespace/case differences
- Review deduplication logic in `appIngest.ts`
- Consider fuzzy matching for company names

## Escalation

### When to escalate:

1. **Critical (immediate):**
   - Production API outages
   - Data loss or corruption
   - Security incidents

2. **High (within 4 hours):**
   - Batch jobs failing consistently
   - Cost overruns > 150%
   - Performance degradation > 50%

3. **Medium (within 1 day):**
   - Configuration drift
   - Intermittent failures
   - Documentation gaps

### Escalation Path:

1. **Tier 1:** Team lead / On-call engineer
2. **Tier 2:** Platform team
3. **Tier 3:** Vendor support (OpenAI/Anthropic)

### Information to Provide:

- Health check output (`gloven health --json`)
- Recent logs (last 100 lines)
- Cost ledger for current month
- Sample of failed operations
- Steps to reproduce

## Additional Resources

- [Batch Scoring Runbook](./batch_scoring_runbook.md)
- [Gloven CLI Documentation](../../tools/gloven-cli/README.md)
- [Provider Status Pages](#)
  - OpenAI: https://status.openai.com/
  - Anthropic: https://status.anthropic.com/
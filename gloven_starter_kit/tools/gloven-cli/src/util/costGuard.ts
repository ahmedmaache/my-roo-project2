/**
 * Cost guard utilities for estimating token usage and tracking costs
 */

/**
 * Rough token estimation using character count heuristic
 * This is a simplified approach: ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost based on token counts
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  costPer1kInput: number,
  costPer1kOutput: number
): number {
  const inputCost = (inputTokens / 1000) * costPer1kInput;
  const outputCost = (outputTokens / 1000) * costPer1kOutput;
  return inputCost + outputCost;
}

/**
 * Log cost estimate for transparency
 */
export function logCostEstimate(
  promptText: string,
  expectedOutputTokens: number,
  costPer1kInput: number,
  costPer1kOutput: number
): void {
  if (costPer1kInput === 0 && costPer1kOutput === 0) {
    // No cost tracking configured
    return;
  }

  const inputTokens = estimateTokens(promptText);
  const cost = estimateCost(inputTokens, expectedOutputTokens, costPer1kInput, costPer1kOutput);

  console.log(`\n💰 Cost Estimate:`);
  console.log(`   Input tokens: ~${inputTokens.toLocaleString()}`);
  console.log(`   Expected output tokens: ~${expectedOutputTokens.toLocaleString()}`);
  console.log(`   Estimated cost: $${cost.toFixed(4)}`);
}

/**
 * Check if cost exceeds threshold and refuse if so
 */
export function checkCostThreshold(
  promptText: string,
  expectedOutputTokens: number,
  costPer1kInput: number,
  costPer1kOutput: number,
  threshold: number = 1.0
): boolean {
  if (costPer1kInput === 0 && costPer1kOutput === 0) {
    // No cost tracking, allow
    return true;
  }

  const inputTokens = estimateTokens(promptText);
  const cost = estimateCost(inputTokens, expectedOutputTokens, costPer1kInput, costPer1kOutput);

  if (cost > threshold) {
    console.error(`\n❌ Cost exceeds threshold!`);
    console.error(`   Estimated cost: $${cost.toFixed(4)}`);
    console.error(`   Threshold: $${threshold.toFixed(4)}`);
    console.error(`   Set a higher threshold or reduce token usage.`);
    return false;
  }

  return true;
}
/**
 * PII redaction for logs
 * Redacts emails, phone-like patterns, URLs, API keys
 */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;
const API_KEY_REGEX = /\b([a-zA-Z0-9_-]{32,})\b/g;

const REDACTED = '[REDACTED]';

/**
 * Redact PII from text
 */
export function redact(text: string): string {
  // Check if redaction should be forced
  const forcedRedaction = process.env.GLOVEN_LOG_PII === 'false';
  
  if (!forcedRedaction && process.env.GLOVEN_LOG_PII === 'true') {
    // Explicitly allow PII logging
    return text;
  }

  let redacted = text;
  
  // Redact emails
  redacted = redacted.replace(EMAIL_REGEX, REDACTED);
  
  // Redact phone numbers
  redacted = redacted.replace(PHONE_REGEX, REDACTED);
  
  // Redact URLs (but keep protocol)
  redacted = redacted.replace(URL_REGEX, (match) => {
    const protocol = match.startsWith('https') ? 'https://' : 'http://';
    return `${protocol}${REDACTED}`;
  });
  
  // Redact potential API keys (long alphanumeric strings)
  redacted = redacted.replace(API_KEY_REGEX, (match) => {
    // Don't redact common words or short strings
    if (match.length < 32) return match;
    // Don't redact if it's part of a filename or path
    if (text.includes(`/${match}`) || text.includes(`${match}.`)) return match;
    return REDACTED;
  });

  return redacted;
}
/**
 * Markdown Processing Utilities
 * 
 * Converts markdown to HTML for portal display.
 */

import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

/**
 * Convert markdown string to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm) // GitHub Flavored Markdown (tables, strikethrough, etc.)
    .use(remarkHtml, { sanitize: false }) // Allow HTML in markdown
    .process(markdown);

  return result.toString();
}
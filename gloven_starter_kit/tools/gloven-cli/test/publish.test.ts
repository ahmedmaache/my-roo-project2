/**
 * Tests for publish-portal-data command
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeApplication,
  sanitizeLeaderboard,
  getTopEntries,
  sanitizeMarkdown,
} from '../src/util/sanitize.js';
import type { CRMApplication } from '../src/types_crm.js';

describe('Publish Portal Data', () => {
  const sampleApp: CRMApplication = {
    id: 'app-001',
    founderName: 'John Doe',
    email: 'john@startup.com',
    company: 'TestCo',
    region: 'North America',
    stage: 'Seed',
    summary: 'A revolutionary SaaS platform. Contact: john@startup.com or call +1-555-0123',
    decision: 'GO',
    scoreTotal: 85,
    risks: ['Market competition'],
  };

  describe('sanitizeApplication', () => {
    it('should remove emails from summary', () => {
      const sanitized = sanitizeApplication(sampleApp);
      expect(sanitized.summary).not.toContain('john@startup.com');
      expect(sanitized.summary).toContain('[EMAIL_REDACTED]');
    });

    it('should remove phones from summary', () => {
      const sanitized = sanitizeApplication(sampleApp);
      expect(sanitized.summary).not.toContain('+1-555-0123');
      expect(sanitized.summary).toContain('[PHONE_REDACTED]');
    });

    it('should not include founder name or email in output', () => {
      const sanitized = sanitizeApplication(sampleApp);
      expect(sanitized).not.toHaveProperty('founderName');
      expect(sanitized).not.toHaveProperty('email');
    });

    it('should truncate summary to max length', () => {
      const longSummary = 'A'.repeat(500);
      const app = { ...sampleApp, summary: longSummary };
      const sanitized = sanitizeApplication(app, { maxSummaryLength: 200 });
      expect(sanitized.summary!.length).toBeLessThanOrEqual(200);
    });

    it('should include allowed fields only', () => {
      const sanitized = sanitizeApplication(sampleApp);
      expect(sanitized).toHaveProperty('id');
      expect(sanitized).toHaveProperty('company');
      expect(sanitized).toHaveProperty('region');
      expect(sanitized).toHaveProperty('stage');
      expect(sanitized).toHaveProperty('scoreTotal');
      expect(sanitized).toHaveProperty('band');
    });
  });

  describe('sanitizeLeaderboard', () => {
    const apps: CRMApplication[] = [
      { ...sampleApp, id: 'app-001', scoreTotal: 85, company: 'Company A' },
      { ...sampleApp, id: 'app-002', scoreTotal: 92, company: 'Company B' },
      { ...sampleApp, id: 'app-003', scoreTotal: 78, company: 'Company C' },
      { ...sampleApp, id: 'app-004', scoreTotal: 92, company: 'Company D' }, // Same score as B
    ];

    it('should produce deterministic ordering', () => {
      const leaderboard1 = sanitizeLeaderboard(apps);
      const leaderboard2 = sanitizeLeaderboard(apps);
      
      expect(leaderboard1.entries).toEqual(leaderboard2.entries);
    });

    it('should sort by score DESC, then id ASC', () => {
      const leaderboard = sanitizeLeaderboard(apps);
      
      // Rank 1: app-002 (score 92, id comes before app-004)
      expect(leaderboard.entries[0].id).toBe('app-002');
      expect(leaderboard.entries[0].rank).toBe(1);
      
      // Rank 2: app-004 (score 92, id comes after app-002)
      expect(leaderboard.entries[1].id).toBe('app-004');
      expect(leaderboard.entries[1].rank).toBe(2);
      
      // Rank 3: app-001 (score 85)
      expect(leaderboard.entries[2].id).toBe('app-001');
      expect(leaderboard.entries[2].rank).toBe(3);
      
      // Rank 4: app-003 (score 78)
      expect(leaderboard.entries[3].id).toBe('app-003');
      expect(leaderboard.entries[3].rank).toBe(4);
    });

    it('should include metadata', () => {
      const leaderboard = sanitizeLeaderboard(apps);
      expect(leaderboard).toHaveProperty('generated');
      expect(leaderboard.totalApps).toBe(apps.length);
    });

    it('should filter out apps without scores', () => {
      const appsWithMissing = [
        ...apps,
        { ...sampleApp, id: 'app-005', scoreTotal: undefined },
      ];
      
      const leaderboard = sanitizeLeaderboard(appsWithMissing);
      expect(leaderboard.entries.length).toBe(apps.length);
    });
  });

  describe('getTopEntries', () => {
    const apps: CRMApplication[] = Array.from({ length: 20 }, (_, i) => ({
      ...sampleApp,
      id: `app-${String(i + 1).padStart(3, '0')}`,
      scoreTotal: 90 - i,
      company: `Company ${i + 1}`,
    }));

    it('should return top N entries', () => {
      const leaderboard = sanitizeLeaderboard(apps);
      const top10 = getTopEntries(leaderboard, 10);
      
      expect(top10.entries.length).toBe(10);
      expect(top10.entries[0].rank).toBe(1);
      expect(top10.entries[9].rank).toBe(10);
    });

    it('should preserve leaderboard metadata', () => {
      const leaderboard = sanitizeLeaderboard(apps);
      const top10 = getTopEntries(leaderboard, 10);
      
      expect(top10.generated).toBe(leaderboard.generated);
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should redact emails from markdown', () => {
      const input = 'Contact us at support@gloven.org for more info.';
      const sanitized = sanitizeMarkdown(input);
      
      expect(sanitized).not.toContain('support@gloven.org');
      expect(sanitized).toContain('[EMAIL_REDACTED]');
    });

    it('should redact phones from markdown', () => {
      const input = 'Call us at +1 (555) 123-4567 today!';
      const sanitized = sanitizeMarkdown(input);
      
      expect(sanitized).not.toContain('+1 (555) 123-4567');
      expect(sanitized).toContain('[PHONE_REDACTED]');
    });

    it('should preserve markdown formatting', () => {
      const input = '# Header\n\n- Item 1\n- Item 2\n\n**Bold text**';
      const sanitized = sanitizeMarkdown(input);
      
      expect(sanitized).toContain('# Header');
      expect(sanitized).toContain('**Bold text**');
    });
  });

  describe('Schema validation', () => {
    it('should produce valid leaderboard JSON structure', () => {
      const apps: CRMApplication[] = [sampleApp];
      const leaderboard = sanitizeLeaderboard(apps);
      
      // Validate structure
      expect(typeof leaderboard.generated).toBe('string');
      expect(typeof leaderboard.totalApps).toBe('number');
      expect(Array.isArray(leaderboard.entries)).toBe(true);
      
      if (leaderboard.entries.length > 0) {
        const entry = leaderboard.entries[0];
        expect(typeof entry.rank).toBe('number');
        expect(typeof entry.id).toBe('string');
        expect(typeof entry.company).toBe('string');
        expect(typeof entry.score).toBe('number');
        expect(['GO', 'WAITLIST', 'NO_GO']).toContain(entry.band);
      }
    });
  });
});
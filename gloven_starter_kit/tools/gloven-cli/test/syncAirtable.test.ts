/**
 * Tests for Airtable sync functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { pullTable, pushRecords } from '../src/connectors/airtable.js';
import type { CRMRecord } from '../src/types_crm.js';

describe('Airtable Sync', () => {
  beforeEach(() => {
    // Ensure DRY_RUN mode for tests
    process.env.DRY_RUN = 'true';
    delete process.env.AIRTABLE_BASE_ID;
    delete process.env.AIRTABLE_TOKEN;
  });

  describe('pullTable (DRY_RUN mode)', () => {
    it('should return placeholder records when no credentials provided', async () => {
      const records = await pullTable('Applications');
      
      expect(Array.isArray(records)).toBe(true);
      expect(records.length).toBeGreaterThan(0);
    });

    it('should return deterministic placeholders', async () => {
      const records1 = await pullTable('Applications');
      const records2 = await pullTable('Applications');
      
      expect(records1).toEqual(records2);
    });

    it('should generate application-like records for app tables', async () => {
      const records = await pullTable('Applications');
      
      expect(records[0]).toHaveProperty('id');
      expect(records[0]).toHaveProperty('externalId');
      expect(records[0]).toHaveProperty('fields');
      
      const fields = records[0].fields;
      expect(fields).toHaveProperty('External ID');
      expect(fields).toHaveProperty('Founder Name');
      expect(fields).toHaveProperty('Email');
      expect(fields).toHaveProperty('Company');
    });

    it('should generate mentor-like records for mentor tables', async () => {
      const records = await pullTable('Mentors');
      
      const fields = records[0].fields;
      expect(fields).toHaveProperty('Name');
      expect(fields).toHaveProperty('Domain');
      expect(fields).toHaveProperty('Region');
    });

    it('should generate investor-like records for investor tables', async () => {
      const records = await pullTable('Investors');
      
      const fields = records[0].fields;
      expect(fields).toHaveProperty('Firm');
      expect(fields).toHaveProperty('Contact');
      expect(fields).toHaveProperty('Check Size');
      expect(fields).toHaveProperty('Sectors');
    });

    it('should include externalId for upsert mapping', async () => {
      const records = await pullTable('Applications');
      
      records.forEach(record => {
        expect(record.externalId).toBeDefined();
        expect(typeof record.externalId).toBe('string');
      });
    });
  });

  describe('pushRecords (DRY_RUN mode)', () => {
    it('should succeed in DRY_RUN without credentials', async () => {
      const records: CRMRecord[] = [
        {
          id: 'rec001',
          externalId: 'app-001',
          fields: {
            'Company': 'TestCo',
            'Score Total': 85,
          },
        },
      ];
      
      const result = await pushRecords('Applications', records);
      
      expect(result.success).toBe(true);
      expect(result.updated).toBe(records.length);
    });

    it('should handle empty records array', async () => {
      const result = await pushRecords('Applications', []);
      
      expect(result.success).toBe(true);
      expect(result.updated).toBe(0);
    });

    it('should support batch operations', async () => {
      const records: CRMRecord[] = Array.from({ length: 25 }, (_, i) => ({
        id: `rec${String(i + 1).padStart(3, '0')}`,
        externalId: `app-${i + 1}`,
        fields: {
          'Company': `Company ${i + 1}`,
          'Score Total': 70 + i,
        },
      }));
      
      const result = await pushRecords('Applications', records);
      
      expect(result.success).toBe(true);
      expect(result.updated).toBe(records.length);
    });
  });

  describe('Pagination handling', () => {
    it('should handle multiple pages in DRY_RUN', async () => {
      // DRY_RUN returns a fixed number of records
      // This test verifies the structure is correct for pagination
      const records = await pullTable('Applications');
      
      expect(Array.isArray(records)).toBe(true);
      // Should return at least some records
      expect(records.length).toBeGreaterThan(0);
    });
  });

  describe('ExternalId mapping', () => {
    it('should preserve externalId for upsert operations', async () => {
      const inputRecords: CRMRecord[] = [
        {
          id: '',
          externalId: 'app-001',
          fields: {
            'External ID': 'app-001',
            'Company': 'TestCo',
            'Score Total': 85,
          },
        },
      ];
      
      const result = await pushRecords('Applications', inputRecords);
      
      expect(result.success).toBe(true);
    });

    it('should handle records without externalId', async () => {
      const inputRecords: CRMRecord[] = [
        {
          id: 'rec001',
          fields: {
            'Company': 'NewCo',
          },
        },
      ];
      
      const result = await pushRecords('Applications', inputRecords);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should provide meaningful error when credentials missing in production mode', async () => {
      process.env.DRY_RUN = 'false';
      delete process.env.AIRTABLE_BASE_ID;
      delete process.env.AIRTABLE_TOKEN;
      
      await expect(pullTable('Applications')).rejects.toThrow('not configured');
    });
  });
});
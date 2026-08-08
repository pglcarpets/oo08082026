import { describe, it, expect } from 'vitest';
import {
  formatKpiNumber,
  formatKpiValuePlus,
  formatKpiAsOf,
  formatTrustedClientsFooter,
} from '../../../site/lib/kpiFormat';

describe('kpiFormat', () => {
  describe('formatKpiNumber', () => {
    it('should format positive numbers and handle negative numbers by clamping to 0', () => {
      // en-IN formatting uses commas: 1,00,000 instead of 100,000
      expect(formatKpiNumber(100000)).toBe('1,00,000');
      expect(formatKpiNumber(-50)).toBe('0');
      expect(formatKpiNumber(0)).toBe('0');
    });
  });

  describe('formatKpiValuePlus', () => {
    it('should format numbers with a plus suffix', () => {
      expect(formatKpiValuePlus(25)).toBe('25+');
      expect(formatKpiValuePlus(1500)).toBe('1,500+');
    });
  });

  describe('formatKpiAsOf', () => {
    it('should return fallback string for invalid date formats', () => {
      expect(formatKpiAsOf('invalid-date')).toBe('As of latest verified update');
    });

    it('should format valid ISO dates using Asia/Kolkata timezone', () => {
      // E.g. UTC 2026-06-26 12:00:00 will be formatted
      const dateStr = '2026-06-26T12:00:00Z';
      // Intl format: 26-Jun-2026 or 26 Jun 2026 depending on node/v8 implementation
      // We can use a regex to match the components to be robust across environment locales
      const result = formatKpiAsOf(dateStr);
      expect(result).toMatch(/^As of \d{2} [A-Za-z]{3} \d{4}$/);
      expect(result).toContain('2026');
      expect(result).toContain('Jun');
    });
  });

  describe('formatTrustedClientsFooter', () => {
    it('should generate expected footer text', () => {
      expect(formatTrustedClientsFooter(120)).toBe(
        '120+ clients across Government, Finance, Energy, Manufacturing & more'
      );
    });
  });
});

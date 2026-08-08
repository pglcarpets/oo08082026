import { describe, it, expect } from 'vitest';
import {
  sanitizeDisplayText,
  normalizeDimensionText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from '../../../site/lib/displayText';

describe('displayText', () => {
  describe('sanitizeDisplayText', () => {
    it('should handle empty or null values', () => {
      expect(sanitizeDisplayText('')).toBe('');
      // @ts-expect-error runtime null guard
      expect(sanitizeDisplayText(null)).toBe('');
      // @ts-expect-error runtime undefined guard
      expect(sanitizeDisplayText(undefined)).toBe('');
    });

    it('should replace special characters and normalize whitespace', () => {
      expect(sanitizeDisplayText('Hello\uFFFDWorld')).toBe('HelloWorld');
      expect(sanitizeDisplayText('A\u2013B\u2014C')).toBe('A-B-C');
      expect(sanitizeDisplayText('\u2018A\u2019B\'')).toBe("'A'B'");
      expect(sanitizeDisplayText('\u201cA\u201dB"')).toBe('"A"B"');
      expect(sanitizeDisplayText('so\u2026')).toBe('so...');
      expect(sanitizeDisplayText('\u20B9 500 or ₹600')).toBe('Rs. 500 or Rs. 600');
      expect(sanitizeDisplayText('A\u00a0B')).toBe('A B');
      expect(sanitizeDisplayText('   Hello    World   ')).toBe('Hello World');
    });
  });

  describe('normalizeDimensionText', () => {
    it('should normalize standard dimension formats with mm', () => {
      expect(normalizeDimensionText('W 1200 D 600 H 750 mm')).toBe('W 1200 x D 600 x H 750 mm');
      expect(normalizeDimensionText('W1200D600H750-1050mm')).toBe('W 1200 x D 600 x H 750-1050 mm');
      expect(normalizeDimensionText('W1200 D600 H750mm')).toBe('W 1200 x D 600 x H 750 mm');
      expect(normalizeDimensionText('W600D600H9001000mm (seat height adj. via gas lift)')).toBe(
        'W 600 x D 600 x H 900-1000 mm (seat height adj. via gas lift)',
      );
      expect(normalizeDimensionText('W600 D600 H900-1000mm')).toBe('W 600 x D 600 x H 900-1000 mm');
    });

    it('should add spaces between digits and capital letters or words', () => {
      expect(normalizeDimensionText('1200mm')).toBe('1200 mm');
      expect(normalizeDimensionText('1200W')).toBe('1200 W');
      expect(normalizeDimensionText('fabricWood')).toBe('fabric Wood');
    });

    it('should ensure spaces after W, D, H, L before digits', () => {
      expect(normalizeDimensionText('W120 D80 H75 L10')).toBe('W 120 D 80 H 75 L 10');
    });
  });

  describe('filterMeaningfulDimensionText', () => {
    it('should return normalized text if it contains digits', () => {
      expect(filterMeaningfulDimensionText('W 1200 D 600')).toBe('W 1200 D 600');
    });

    it('should return empty string if no digits are present', () => {
      expect(filterMeaningfulDimensionText('no dimensions here')).toBe('');
    });
  });

  describe('filterMeaningfulMaterialList', () => {
    it('should return empty array for empty inputs', () => {
      expect(filterMeaningfulMaterialList([])).toEqual([]);
      expect(filterMeaningfulMaterialList(['', '   '])).toEqual([]);
    });

    it('should return empty array if all elements are generic materials', () => {
      expect(filterMeaningfulMaterialList(['fabric', 'wood', 'foam/nylon'])).toEqual([]);
      expect(filterMeaningfulMaterialList(['Steel & Metal', 'Plastic'])).toEqual([]);
    });

    it('should return cleaned list if at least one item is non-generic', () => {
      expect(filterMeaningfulMaterialList(['fabric', 'Premium Italian Leather', 'wood'])).toEqual([
        'fabric',
        'Premium Italian Leather',
        'wood',
      ]);
    });
  });
});

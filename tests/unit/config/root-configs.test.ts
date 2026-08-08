// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import path from 'path';

vi.mock('next-intl/plugin', () => {
  const mockPlugin = () => (config: object) => ({ ...config });
  return { default: mockPlugin };
});

import nextConfig from '../../../site/next.config.js';
import vitestConfig from '../../../tests/vitest.config';
import vitestSiteConfig from '../../../tests/vitest.site.config';
import playwrightConfig from '../../../config/build/playwright.config';
import {
  VITEST_COVERAGE_DIRS,
  VITEST_REPORT_PATHS,
  VITEST_WORKSPACE_ROOT,
} from '../../../tests/vitest.shared';

function reporterOption(
  reporters: unknown,
  name: string,
): Record<string, unknown> | undefined {
  if (!Array.isArray(reporters)) return undefined;
  for (const entry of reporters) {
    if (!Array.isArray(entry) || entry[0] !== name) continue;
    const options = entry[1];
    if (options && typeof options === 'object') {
      return options as Record<string, unknown>;
    }
  }
  return undefined;
}

describe('Root Configurations', () => {
  describe('next.config.js', () => {
    it('should export a valid next configuration object or function', () => {
      expect(nextConfig).toBeDefined();
      expect(['object', 'function']).toContain(typeof nextConfig);
    });
  });

  describe('postcss.config.mjs', () => {
    it('should export a valid postcss configuration', async () => {
      const postcssConfig = await import('../../../site/postcss.config.mjs');
      expect(postcssConfig.default).toBeDefined();
    });
  });

  describe('vitest.config.ts', () => {
    it('should export a valid vitest configuration', () => {
      expect(vitestConfig).toBeDefined();
      expect(vitestConfig.test).toBeDefined();
      expect(vitestConfig.test?.environment).toBe('happy-dom');
      expect(vitestConfig.test?.coverage?.reportsDirectory).toBe(VITEST_COVERAGE_DIRS.full);
      {
        const outputFile = vitestConfig.test?.outputFile;
        const jsonOut = typeof outputFile === 'object' && outputFile ? outputFile.json : undefined;
        expect(path.normalize(jsonOut ?? '')).toBe(
          path.normalize(path.join(VITEST_WORKSPACE_ROOT, 'results/tests/vitest-results.json')),
        );
      }
    });
  });

  describe('vitest.site.config.ts', () => {
    it('should export a valid site vitest configuration with matching report paths', () => {
      expect(vitestSiteConfig).toBeDefined();
      expect(vitestSiteConfig.test).toBeDefined();
      expect(vitestSiteConfig.test?.environment).toBe('happy-dom');
      expect(vitestSiteConfig.test?.coverage?.reportsDirectory).toBe(VITEST_COVERAGE_DIRS.site);
      {
        const outputFile = vitestSiteConfig.test?.outputFile;
        const jsonOut = typeof outputFile === 'object' && outputFile ? outputFile.json : undefined;
        expect(
          path.normalize(jsonOut ?? ''),
        ).toBe(path.normalize(path.join(VITEST_WORKSPACE_ROOT, 'results/tests/vitest-site-results.json')));
      }
      expect(path.dirname(VITEST_REPORT_PATHS.full.json)).toBe(path.dirname(VITEST_REPORT_PATHS.site.json));
    });
  });

  describe('playwright.config.ts', () => {
    it('routes Playwright artifacts under results/', () => {
      expect(playwrightConfig).toBeDefined();
      expect(
        path.normalize(String(playwrightConfig.outputDir ?? '')),
      ).toContain(path.normalize('results/test-results'));

      const htmlOptions = reporterOption(playwrightConfig.reporter, 'html');
      const jsonOptions = reporterOption(playwrightConfig.reporter, 'json');

      expect(path.normalize(String(htmlOptions?.outputFolder ?? ''))).toContain(
        path.normalize('results/playwright-report'),
      );
      expect(path.normalize(String(jsonOptions?.outputFile ?? ''))).toContain(
        path.normalize('results/audits/raw-playwright.json'),
      );
    });
  });
});

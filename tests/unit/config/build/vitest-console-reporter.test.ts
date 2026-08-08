// @vitest-environment node
/**
 * Name-mirror: config/build/vitest-console-reporter.ts
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { UserConsoleLog } from "vitest";
import ConsoleReporter from "../../../../config/build/vitest-console-reporter";

type ConsoleReportFile = {
  schemaVersion: number;
  generatedAt: string;
  consoleCount: number;
  stderrCount: number;
  stdoutCount: number;
  entries: Array<{
    content: string;
    type: UserConsoleLog["type"];
    testName?: string;
    taskId?: string;
  }>;
};

function makeLog(
  partial: Pick<UserConsoleLog, "content" | "type"> &
    Partial<Pick<UserConsoleLog, "taskId" | "origin" | "time">>,
): UserConsoleLog {
  return {
    content: partial.content,
    type: partial.type,
    taskId: partial.taskId,
    origin: partial.origin,
    time: partial.time ?? Date.now(),
  } as UserConsoleLog;
}

describe("config/build/vitest-console-reporter.ts", () => {
  let tempDir: string;
  let outputFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vitest-console-reporter-"));
    outputFile = path.join(tempDir, "console-report.json");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("constructs with required outputFile option", () => {
    const reporter = new ConsoleReporter({ outputFile });
    expect(reporter).toBeInstanceOf(ConsoleReporter);
  });

  it("writes schema v1 JSON with counts after onTestRunEnd", () => {
    const reporter = new ConsoleReporter({ outputFile });
    reporter.onTestRunStart();

    reporter.onTestCaseReady({
      id: "t1",
      fullName: "suite > captures stdout",
    } as Parameters<NonNullable<typeof reporter.onTestCaseReady>>[0]);

    reporter.onUserConsoleLog(
      makeLog({ content: "hello stdout", type: "stdout", taskId: "t1" }),
    );
    reporter.onUserConsoleLog(
      makeLog({ content: "oops stderr", type: "stderr", taskId: "t1" }),
    );

    reporter.onTestCaseResult({
      id: "t1",
      fullName: "suite > captures stdout",
    } as Parameters<NonNullable<typeof reporter.onTestCaseResult>>[0]);

    reporter.onTestRunEnd();

    expect(fs.existsSync(outputFile)).toBe(true);
    const raw = fs.readFileSync(outputFile, "utf8");
    const report = JSON.parse(raw) as ConsoleReportFile;

    expect(report.schemaVersion).toBe(1);
    expect(typeof report.generatedAt).toBe("string");
    expect(report.generatedAt.length).toBeGreaterThan(0);
    expect(report.consoleCount).toBe(2);
    expect(report.stdoutCount).toBe(1);
    expect(report.stderrCount).toBe(1);
    expect(report.entries).toHaveLength(2);
    expect(report.entries[0]?.content).toBe("hello stdout");
    expect(report.entries[0]?.type).toBe("stdout");
    expect(report.entries[0]?.testName).toBe("suite > captures stdout");
    expect(report.entries[1]?.content).toBe("oops stderr");
    expect(report.entries[1]?.type).toBe("stderr");
  });

  it("resets entries on a new test run", () => {
    const reporter = new ConsoleReporter({ outputFile });
    reporter.onTestRunStart();
    reporter.onUserConsoleLog(makeLog({ content: "first", type: "stdout" }));
    reporter.onTestRunEnd();

    reporter.onTestRunStart();
    reporter.onUserConsoleLog(makeLog({ content: "second", type: "stdout" }));
    reporter.onTestRunEnd();

    const report = JSON.parse(
      fs.readFileSync(outputFile, "utf8"),
    ) as ConsoleReportFile;
    expect(report.consoleCount).toBe(1);
    expect(report.entries[0]?.content).toBe("second");
  });

  it("creates parent directories for outputFile", () => {
    const nested = path.join(tempDir, "nested", "dir", "out.json");
    const reporter = new ConsoleReporter({ outputFile: nested });
    reporter.onTestRunStart();
    reporter.onTestRunEnd();
    expect(fs.existsSync(nested)).toBe(true);
  });
});

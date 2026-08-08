import fs from "node:fs";
import path from "node:path";
import type { UserConsoleLog } from "vitest";
import type { Reporter } from "vitest/reporters";

interface ConsoleReporterOptions {
  outputFile: string;
}

interface CapturedConsole {
  content: string;
  origin?: string;
  taskId?: string;
  testName?: string;
  time: number;
  type: UserConsoleLog["type"];
}

type ReporterTestCase = Parameters<NonNullable<Reporter["onTestCaseReady"]>>[0];
type ReporterTestResult = Parameters<NonNullable<Reporter["onTestCaseResult"]>>[0];

export default class ConsoleReporter implements Reporter {
  private readonly outputFile: string;
  private entries: CapturedConsole[] = [];
  private taskNames = new Map<string, string>();

  constructor(options: ConsoleReporterOptions) {
    this.outputFile = options.outputFile;
  }

  onTestRunStart(): void {
    this.entries = [];
    this.taskNames.clear();
  }

  onTestCaseReady(testCase: ReporterTestCase): void {
    this.taskNames.set(testCase.id, testCase.fullName);
  }

  onTestCaseResult(testCase: ReporterTestResult): void {
    this.taskNames.set(testCase.id, testCase.fullName);
  }

  onUserConsoleLog(log: UserConsoleLog): void {
    this.entries.push({
      content: log.content,
      origin: log.origin,
      taskId: log.taskId,
      time: log.time,
      type: log.type,
    });
  }

  onTestRunEnd(): void {
    const entries = this.entries.map((entry) => ({
      ...entry,
      testName: entry.taskId ? this.taskNames.get(entry.taskId) : undefined,
    }));
    const stderrCount = entries.filter((entry) => entry.type === "stderr").length;
    const stdoutCount = entries.filter((entry) => entry.type === "stdout").length;

    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(
      this.outputFile,
      JSON.stringify(
        {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          consoleCount: entries.length,
          stderrCount,
          stdoutCount,
          entries,
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

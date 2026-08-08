import { vi } from "vitest";

vi.mock("next-intl/server", async () => {
  const enMessages = (await import("@/i18n/messages/en.json")).default;

  const resolveNested = (root: Record<string, unknown>, key: string): unknown => {
    const parts = key.split(".");
    let current: unknown = root;
    for (const part of parts) {
      if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  };

  return {
    getTranslations: async (namespace: string) => {
      const messages = enMessages[namespace as keyof typeof enMessages] as Record<string, unknown>;
      const t = (key: string) => {
        const val = resolveNested(messages, key);
        return typeof val === "string" ? val : key;
      };
      t.raw = (key: string) => resolveNested(messages, key) ?? [];
      t.rich = t;
      return t;
    },
    getLocale: async () => "en",
    getMessages: async () => enMessages,
  };
});

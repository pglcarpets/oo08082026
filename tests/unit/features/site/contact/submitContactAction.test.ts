import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  contactFormSchema,
  submitContactActionSchema,
} from "@/features/site/contact/customerQuerySchema";
import { createCustomerQuery } from "@/features/site/contact/createCustomerQuery";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () =>
    new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    }),
  ),
}));

vi.mock("@/features/site/contact/createCustomerQuery", () => ({
  createCustomerQuery: vi.fn(),
}));

import { submitContactAction } from "@/features/site/contact/submitContactAction";

const validInput = {
  name: "Alex",
  company: "Acme",
  email: "alex@example.com",
  phone: "",
  preferredContact: "email" as const,
  message: "Need 20 chairs for a pilot floor.",
  website: "",
  consent: true,
};

describe("submitContactAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a callable server action", () => {
    expect(typeof submitContactAction).toBe("function");
  });

  it("wires action input schema to contact form schema", () => {
    expect(submitContactActionSchema).toBe(contactFormSchema);
    expect(submitContactActionSchema.safeParse(validInput).success).toBe(true);
    expect(
      submitContactActionSchema.safeParse({ ...validInput, consent: false })
        .success,
    ).toBe(false);
    expect(
      submitContactActionSchema.safeParse({ ...validInput, email: "", phone: "" })
        .success,
    ).toBe(false);
    // Honeypot may be filled; domain handles silent fake success.
    expect(
      submitContactActionSchema.safeParse({
        ...validInput,
        website: "http://spam.example",
      }).success,
    ).toBe(true);
  });

  it("strips consent, forwards IP, and returns domain success", async () => {
    vi.mocked(createCustomerQuery).mockResolvedValue({
      ok: true,
      queryId: "query-42",
      createdAt: "2026-07-21T00:00:00.000Z",
      followUp: {
        email: "mailto:alex@example.com",
        whatsapp: null,
      },
      honeypot: false,
    });

    const result = await submitContactAction(validInput);

    expect(createCustomerQuery).toHaveBeenCalledTimes(1);
    const [payload, opts] = vi.mocked(createCustomerQuery).mock.calls[0];
    expect(payload).not.toHaveProperty("consent");
    expect(payload).toMatchObject({
      name: "Alex",
      email: "alex@example.com",
      message: "Need 20 chairs for a pilot floor.",
    });
    expect(opts).toEqual({ ip: "203.0.113.10" });

    expect(result).toMatchObject({
      data: {
        queryId: "query-42",
        createdAt: "2026-07-21T00:00:00.000Z",
        followUp: {
          email: "mailto:alex@example.com",
          whatsapp: null,
        },
      },
    });
  });

  it("returns validationErrors for consent false without domain call", async () => {
    const result = await submitContactAction({
      ...validInput,
      consent: false,
    });

    expect(createCustomerQuery).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      validationErrors: expect.anything(),
    });
  });

  it("returns validationErrors for other schema failures without domain call", async () => {
    const result = await submitContactAction({
      ...validInput,
      email: "",
      phone: "",
    });

    expect(createCustomerQuery).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      validationErrors: expect.anything(),
    });
  });

  it("forwards honeypot website and maps domain honeypot success", async () => {
    vi.mocked(createCustomerQuery).mockResolvedValue({
      ok: true,
      queryId: "submitted",
      createdAt: "2026-07-21T00:00:00.000Z",
      followUp: { email: null, whatsapp: null },
      honeypot: true,
    });

    const result = await submitContactAction({
      ...validInput,
      website: "http://spam.example",
    });

    expect(createCustomerQuery).toHaveBeenCalledTimes(1);
    const [payload] = vi.mocked(createCustomerQuery).mock.calls[0];
    expect(payload).toMatchObject({ website: "http://spam.example" });
    expect(payload).not.toHaveProperty("consent");
    expect(result).toMatchObject({
      data: {
        queryId: "submitted",
        followUp: { email: null, whatsapp: null },
      },
    });
  });

  it("maps domain failure to serverError", async () => {
    vi.mocked(createCustomerQuery).mockResolvedValue({
      ok: false,
      kind: "database",
      message: "Unable to save your request right now.",
      code: "DATABASE_ERROR" as never,
    });

    const result = await submitContactAction(validInput);

    expect(createCustomerQuery).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      serverError: "Unable to save your request right now.",
    });
  });
});

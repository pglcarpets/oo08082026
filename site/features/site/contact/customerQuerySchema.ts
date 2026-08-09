import { z } from "zod";

// Avoid Zod v4 JIT `new Function` probe on marketing pages (strict CSP, no unsafe-eval).
z.config({ jitless: true });

/** Preferred contact channel (matches live API + form). */
export const preferredContactSchema = z.enum([
  "any",
  "email",
  "whatsapp",
  "phone",
]);

export type PreferredContact = z.infer<typeof preferredContactSchema>;

/**
 * Shared field lengths = server normalizeText caps in createCustomerQuery.
 * Empty strings are allowed for optional channels; email OR phone is enforced
 * via superRefine. Honeypot must not reject non-empty values.
 *
 * Field types stay required strings (not optional+default) so RHF input/output
 * types match zodResolver without casts.
 */
export const customerQueryFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name and message are required.")
    .max(180),
  company: z.string().trim().max(180),
  email: z.string().trim().max(180),
  phone: z.string().trim().max(50),
  preferredContact: preferredContactSchema,
  message: z
    .string()
    .trim()
    .min(1, "Name and message are required.")
    .max(5000),
  /** Honeypot — humans leave empty; bots that fill it still parse. */
  website: z.string().max(120),
  requirement: z.string().trim().max(300).optional(),
  budget: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(120).optional(),
  source: z.string().trim().max(60).optional(),
  sourcePath: z.string().trim().max(200).optional(),
});

function emailOrPhoneRefine(
  val: { email: string; phone: string },
  ctx: z.RefinementCtx,
): void {
  if (!val.email && !val.phone) {
    ctx.addIssue({
      code: "custom",
      message: "Please provide email or phone.",
      path: ["email"],
    });
  }
}

/** API / domain body: email OR phone after trim (matches route errors). */
export const customerQueryPayloadSchema =
  customerQueryFieldsSchema.superRefine(emailOrPhoneRefine);

/**
 * Contact page form: payload rules + privacy consent.
 * Consent is form-only UX gate (never persisted).
 */
export const contactFormSchema = customerQueryFieldsSchema
  .extend({
    consent: z.boolean().refine((value) => value === true, {
      message: "Confirm privacy consent before sending.",
    }),
  })
  .superRefine(emailOrPhoneRefine);

/** Action input = form schema (consent stripped before DB). */
export const submitContactActionSchema = contactFormSchema;

export type CustomerQueryPayload = z.infer<typeof customerQueryPayloadSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type SubmitContactActionInput = z.infer<typeof submitContactActionSchema>;

/** Default RHF values for the contact form (consent starts unchecked). */
export const contactFormDefaultValues: ContactFormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  preferredContact: "any",
  message: "",
  website: "",
  consent: false,
};

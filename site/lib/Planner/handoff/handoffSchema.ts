import { z } from "zod";

export const plannerHandoffContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email().or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const plannerHandoffBoqSchema = z.object({
  projectId: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  calculationHash: z.string().trim().min(16).max(128),
  lines: z.array(z.record(z.string(), z.unknown())).default([]),
  subtotalInr: z.number().finite().nonnegative().optional().default(0),
  gstInr: z.number().finite().nonnegative().optional().default(0),
  totalInr: z.number().finite().nonnegative().optional().default(0),
});

export const plannerHandoffRequestSchema = z.object({
  contact: plannerHandoffContactSchema,
  boq: plannerHandoffBoqSchema,
  idempotencyKey: z.string().trim().min(1).max(120),
  projectNotes: z.string().trim().max(2000).optional(),
});

export type PlannerHandoffRequest = z.infer<typeof plannerHandoffRequestSchema>;

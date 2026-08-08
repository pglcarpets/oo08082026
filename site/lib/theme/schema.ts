import { z } from 'zod';

export const blockThemePayloadSchema = z.record(z.string(), z.string()).refine(
  (data) => Object.values(data).every((val) => typeof val === 'string'),
  { message: "Payload must be a flat dictionary of string tokens." }
);

export type BlockThemePayload = z.infer<typeof blockThemePayloadSchema>;

export const blockThemeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  payload_jsonb: blockThemePayloadSchema,
  is_active: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type BlockTheme = z.infer<typeof blockThemeSchema>;

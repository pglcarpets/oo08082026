import { z } from "zod";

export const suggestedLayoutSchema = z.object({
  room: z.object({
    widthMm: z.number().finite().positive(),
    depthMm: z.number().finite().positive(),
  }),
  items: z.array(
    z.object({
      catalogId: z.string().trim().min(1),
      xMm: z.number().finite(),
      yMm: z.number().finite(),
      rotationDeg: z.number().finite().default(0),
    }),
  ),
});

export type SuggestedLayoutJson = z.infer<typeof suggestedLayoutSchema>;

export function validateLayoutSchema(
  input: unknown,
): { ok: true; layout: SuggestedLayoutJson } | { ok: false; error: string } {
  const parsed = suggestedLayoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid layout schema" };
  }
  return { ok: true, layout: parsed.data };
}

import { z } from "zod";

export const projectSetupSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  roomWidthMm: z.number().finite().positive().max(200_000),
  roomDepthMm: z.number().finite().positive().max(200_000),
  seatTarget: z.number().int().positive().max(10_000).optional(),
  unitSystem: z.enum(["mm", "in"]).default("mm"),
});

export type ProjectSetup = z.infer<typeof projectSetupSchema>;

export function defaultProjectSetup(
  overrides: Partial<ProjectSetup> = {},
): ProjectSetup {
  return projectSetupSchema.parse({
    projectName: "Untitled Plan",
    roomWidthMm: 10_000,
    roomDepthMm: 7_000,
    unitSystem: "mm",
    ...overrides,
  });
}

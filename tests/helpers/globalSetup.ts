import path from "node:path";
import { ensureFurnitureSeeded } from "@studio/server/studioFurnitureSeed";

/**
 * Materialise the default furniture library once, before any test file runs.
 *
 * The Studio owns catalog writes and the Planner only reads the result, so
 * without this the Planner catalog specs pass or fail purely on whether the
 * Studio specs happened to run first. Seeding here is test infrastructure, not
 * app code, so it does not bridge the planner/studio boundary.
 */
export default async function setup(): Promise<void> {
  process.chdir(path.resolve(__dirname, "../.."));
  await ensureFurnitureSeeded();
}

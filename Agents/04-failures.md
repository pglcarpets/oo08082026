# Failures

## Bar
- Active blockers live only in root **`Failures.md`**.
- Add a row with repro when a ship blocker appears.
- Remove a row only after verified fix with evidence.
- Empty “None recorded” is valid when there are no open blockers.
- Do not mark something pre-existing without a baseline run at the commit before
  the work. "I didn't touch that area" is a hypothesis, not evidence.

Open now (synced with root `Failures.md` 2026-08-08): **F3** —
`docs.oando.co.in` has no public DNS (NXDOMAIN). Resolved this session:
**P0-1** (hydration `probeDisk`), **P1-2** (theme API uses presets),
**P1-3** (`mirror:throw` test noise + client IP normalization),
**P1-4** (lockfile installs clean on pnpm 11.20.0).

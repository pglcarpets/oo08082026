# Failures

## Bar
- Active blockers live only in root **`Failures.md`**.
- Add a row with repro when a ship blocker appears.
- Remove a row only after verified fix with evidence.
- Empty “None recorded” is valid when there are no open blockers.
- Do not mark something pre-existing without a baseline run at the commit before
  the work. "I didn't touch that area" is a hypothesis, not evidence.

Open now (synced with root `Failures.md` 2026-08-06): **F1** — Cloudflare Worker
`oando-worker-proxy` proxies `oando.co.in`/www to stale origin
`https://oandpl.vercel.app` instead of `oandoweb`. **F2** — marketing catalog
empty on the live apex (consequence of F1's empty origin). **F3** —
`docs.oando.co.in` has no public DNS (NXDOMAIN). The former tech-docs/auth F1
(gate red / session.test.ts) is resolved — `session.test.ts` passed 10/10 on
2026-08-06; the tech-docs gate itself still needs a fresh exit-0 run.

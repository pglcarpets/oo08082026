# Failures

- Open blockers: root **`Failures.md` only**.
- Add with repro. Remove only after verified fix.
- Empty is valid.
- "Pre-existing" needs a baseline at the prior commit — not a guess.
- Don't copy blocker IDs into other docs — link `Failures.md`.

See [`Failures.md`](../Failures.md).

## How to add a blocker

1. Repro command: the smallest `pnpm run …` or `curl` that shows the failure.
2. Evidence: command output, screenshot, or trace path under `results/`.
3. Owner action: what fix would make this removable.

## How to remove a blocker

Verified fix only. The repro command must exit 0 before the row is deleted.

## Vocabulary

| Word | Meaning |
|------|---------|
| `verified` | I ran the repro command and saw the failure myself |
| `not tested` | I did not run the repro command — do not treat as confirmed |
| `could-not-reproduce` | I ran the repro command and it passed — needs re-check |

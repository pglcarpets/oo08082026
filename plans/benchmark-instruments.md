# Benchmark instruments — build plan

**Source:** Moved from `docs/governance/benchmarks.md` §6 (2026-08-12) per `DOC-MAP` placement rules — actionable work items belong in `plans/`, not reference docs.

**Parent:** [`docs/governance/benchmarks.md`](../docs/governance/benchmarks.md)

---

## Stage 0 work

1. **Rebuild the ergonomics instrument.**
   The admin ergonomics probe / `probe:w1.5-benchmark-admin` alias was removed (2026-08-02).
   Until a gated replacement exists, treat DB1–DB3 / DB5 as **uninstrumented** for ship claims.
   Target bar remains `overall >= 8.5` per DB3 with a per-viewport floor so one strong viewport
   cannot carry a weak one.

2. **Add the missing instruments.**
   The five marked *No* in `benchmarks.md` §4 (plus the removed probe slot).

3. **Bind bars to gates.**
   `README` §7 requires "every goal the plan claims to move has a fresh measured value".
   Each numbered plan's exit criteria must name the specific bars from `benchmarks.md` that it moves.

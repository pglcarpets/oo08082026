---
applyTo: "site/platform/supabase/migrations/**/*.sql"
description: "Database migration rules - applies when editing SQL migration files"
---

# Database Migration Rules

## Critical: Rollback Required

Every migration must include a `-- rollback` section. The governance check ratchets `P4_migration_no_rollback` against the current baseline. A file without a rollback section raises the count and fails the gate.

Run `pnpm run check:governance` to see the current baseline and verify compliance.

## Migration File Structure

```sql
-- Migration: YYYYMMDD_description.sql
-- Description: What this migration does

-- Forward migration
CREATE TABLE ...;
ALTER TABLE ...;

-- rollback
-- Reverse the changes
DROP TABLE ...;
ALTER TABLE ... DROP COLUMN ...;
```

## Naming Convention

- Format: `YYYYMMDD_description.sql`
- Example: `20260804_add_user_preferences.sql`
- Lexicographic order determines execution order

## Supabase Requirements

### Grants AND Policies

Supabase needs **both grants and policies**. A policy without grants still yields "permission denied":

```sql
-- Create policy
CREATE POLICY "Users can view own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions (REQUIRED)
GRANT SELECT ON user_data TO anon, authenticated;
```

### Common Pattern

```sql
-- Forward
CREATE TABLE new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  data jsonb
);

CREATE POLICY "Users manage own rows" ON new_table
  FOR ALL USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON new_table TO anon, authenticated;

-- rollback
DROP TABLE new_table;
```

## Applying Migrations

```bash
# Dry run (check what will be applied)
pnpm run ops db:apply -- --dry

# Apply migrations
pnpm run ops db:apply
```

- `db:apply` applies every migration from the managed batch start onward in lexicographic order
- Tracked in `_local_migration_history` table
- Always confirm with `--dry` first

## Type Regeneration

After schema changes, regenerate types:

```bash
# Admin database types (introspection)
pnpm run ops db:types:admin

# Products database types (Supabase CLI)
pnpm run ops db:types
```

**Never use handwritten `any`** to bypass type errors from stale generated types. Regenerate instead.

## Verification

```bash
# Check governance (includes migration rollback check)
pnpm run check:governance

# Full gate
pnpm run gate
```

## Persistence Mode

Remember: `DEV_AUTH_BYPASS=1` + non-production → **disk**. Otherwise → **Supabase**.

Production has a read-only filesystem, so disk is never the live path there. Route handlers must call mode-aware wrappers, never raw disk helpers.

## References

- Database docs: [`docs/database/ops.md`](../../docs/database/ops.md)
- Schema: [`docs/database/schema.md`](../../docs/database/schema.md)
- Operations: [`OPERATIONS_RUNBOOK.md`](../../OPERATIONS_RUNBOOK.md)

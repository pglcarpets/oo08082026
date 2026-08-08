---
name: supabase-expert
description: Supabase database management, SQL migrations, Row Level Security (RLS) policies, and rollback scripting. Trigger when creating database schemas, migrations, or Supabase queries.
---

# Supabase Expert Skill Instructions

When working with Supabase databases, migrations, and schema design, follow these guidelines:

## 1. Migration Safety & Rollbacks
- Every SQL migration file should include a corresponding `-- rollback` section or explicit undo operations.
- Order migration files chronologically using standard timestamps or sequence prefixes.
- Test migrations locally with dry-run commands before applying to remote environments.

## 2. Row Level Security (RLS) & Grants
- Always enable Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) on newly created tables.
- Define granular RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE` access.
- Note that Supabase RLS policies require proper table grants (`GRANT SELECT ... TO anon, authenticated;`) to allow client queries to succeed.

## 3. Client Integration
- Use strongly typed TypeScript database definitions (e.g. standard `Database` schema generation).
- Distinguish Admin DB roles from Product DB roles when dealing with multi-tenant or multi-project setups.
- Use service role keys exclusively in server environments and user/anon keys for public client queries.

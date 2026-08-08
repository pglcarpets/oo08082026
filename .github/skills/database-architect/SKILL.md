---
name: database-architect
description: Relational (PostgreSQL, MySQL) and NoSQL data modeling, indexing strategies, query execution plans, transactions, and caching. Trigger when designing schemas or optimizing database queries.
---

# Database Architect Skill Instructions

When designing database schemas, writing complex queries, or tuning database performance:

## 1. Schema Design & Normalization
- Design relational schemas with appropriate data types, non-null constraints, foreign key references, and cascade rules.
- Normalize schemas to 3NF for transactional integrity; strategically denormalize only when high-frequency read performance warrants it.
- Use UUIDs or auto-incrementing integer IDs appropriately based on distribution and security requirements.

## 2. Query Optimization & Indexing
- Add database indexes (B-tree, GIN, composite indexes) for columns frequently filtered (`WHERE`), joined (`JOIN`), or ordered (`ORDER BY`).
- Avoid `SELECT *` in production code; query only required column attributes to reduce memory and network overhead.
- Analyze query execution plans (`EXPLAIN ANALYZE`) to identify costly sequential table scans or missing indexes.

## 3. Transactions & Concurrency
- Wrap multi-table mutation sequences in ACID transactions (`BEGIN ... COMMIT / ROLLBACK`).
- Handle optimistic or pessimistic locking to prevent race conditions during concurrent updates.
- Utilize Redis caching for hot read queries with defined expiration (TTL) strategies.

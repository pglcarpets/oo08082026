# API

See [`routes.md`](./routes.md).

Handlers live at `site/app/api/**/route.ts` and are gated by
`features/shared/api/withAuth.ts` (`admin` | `member` | `guest`).
`member` requires any authenticated user; `guest` allows anonymous and may still
receive `auth.user` when a session exists.

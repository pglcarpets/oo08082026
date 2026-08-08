---
name: nextjs-expert
description: Next.js App Router and React modern patterns expert. Trigger when writing or refactoring Next.js app routes, server/client components, data fetching, or page layouts.
---

# Next.js Expert Skill Instructions

When working with Next.js applications (specifically Next.js App Router architecture), apply these core guidelines:

## 1. Server vs Client Component Boundaries
- Keep components as Server Components by default for optimal performance and smaller bundle sizes.
- Mark components with `'use client'` only when requiring client-side interactivity, state (`useState`, `useReducer`), effects (`useEffect`), or browser APIs.
- Keep Client Component boundaries as low down the component tree as possible.

## 2. Routing & Navigation
- Structure routes using standard App Router conventions (`app/page.tsx`, `app/layout.tsx`, `app/loading.tsx`, `app/error.tsx`).
- Always use standard `<Link href="...">` components for navigation or `useRouter()` from `next/navigation`.
- Use `localhost:3000` for local UI testing and testing auth cookies.

## 3. Data Fetching & State
- Fetch data directly in Server Components using async/await when applicable.
- For dynamic data mutation, utilize Server Actions or API route handlers with strict request validation.
- Avoid duplicate state synchronization between local state and global context.

## 4. Environment & Security
- Ensure server secrets (API keys, service role keys) are only accessed in server-side contexts or route handlers.
- Never expose secret environment variables to client bundles; use `NEXT_PUBLIC_` strictly for public values.

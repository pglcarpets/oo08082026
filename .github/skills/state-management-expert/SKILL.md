---
name: state-management-expert
description: State management architectures in React applications using Zustand, Redux Toolkit, React Query, and local state. Trigger when designing app state, managing global stores, or refactoring client data flows.
---

# State Management Expert Skill Instructions

When designing or refactoring application state architecture, apply these core patterns:

## 1. State Scope & Colocation
- Keep state local (`useState`, `useReducer`) whenever data is only needed within a single component subtree.
- Use global stores (Zustand, Redux) strictly for truly shared cross-cutting application state (e.g. user authentication state, active theme, global notifications).
- Separate server cache state (managed via React Query / SWR) from purely UI client state.

## 2. Immutable Updates & Store Design
- Ensure state updates remain immutable. Use selector hooks (`useStore(state => state.property)`) to prevent unnecessary component re-renders when unrelated state properties update.
- Keep state structures normalized to avoid deeply nested object mutations.
- Encapsulate store actions alongside state definitions rather than scattering mutations across UI components.

## 3. Persistence & Hydration
- Manage persisted state (e.g., `localStorage`) with hydration safety checks to avoid server-client SSR mismatch warnings.
- Clean up transient state flags when navigating across routes.

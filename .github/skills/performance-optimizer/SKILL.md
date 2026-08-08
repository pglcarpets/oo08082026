---
name: performance-optimizer
description: Optimize web application performance, Core Web Vitals, bundle sizes, lazy loading, and asset delivery. Trigger when optimizing page load speed, analyzing bundle size, or fixing memory leaks.
---

# Performance Optimizer Skill Instructions

When optimizing frontend/backend web application performance, apply these core strategies:

## 1. Core Web Vitals (LCP, CLS, INP)
- **Largest Contentful Paint (LCP)**: Prioritize loading hero assets using dynamic `priority` tags or link preload hints. Avoid render-blocking synchronous resources.
- **Cumulative Layout Shift (CLS)**: Reserve width/height aspect ratio space for dynamic images, embeds, and ad containers before rendering content.
- **Interaction to Next Paint (INP)**: Break heavy JavaScript tasks into non-blocking chunks (`requestIdleCallback`, web workers) to keep main thread interactions under 200ms.

## 2. Code Splitting & Bundle Minimization
- Dynamic import (`import()`) non-critical heavy modules or modal components so they are loaded on demand.
- Tree-shake unused library exports and inspect bundle composition before introducing large third-party dependencies.
- Optimize image assets with modern compressed formats (WebP, AVIF) and responsive sizing (`srcset` / `sizes`).

## 3. Caching & Memory Management
- Utilize browser HTTP cache headers (`stale-while-revalidate`, long-term immutable caching for hashed static assets).
- Ensure listeners, observers (`IntersectionObserver`, `ResizeObserver`), and event subscriptions are detached on unmount to prevent memory leaks.

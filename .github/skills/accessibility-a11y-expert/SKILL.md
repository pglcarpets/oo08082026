---
name: accessibility-a11y-expert
description: Implement Web Content Accessibility Guidelines (WCAG 2.1 AA), ARIA semantics, keyboard navigation, and screen reader compatibility. Trigger when auditing web accessibility or enhancing UI usability.
---

# Accessibility (A11y) Expert Skill Instructions

When reviewing or building accessible web components, enforce these standard guidelines:

## 1. Semantic HTML & ARIA Attributes
- Use native semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<dialog>`) prior to custom `<div>`/`<span>` tags.
- Provide descriptive `aria-label` or `aria-labelledby` attributes for interactive components lacking visible textual labels (e.g. icon buttons).
- Use `aria-expanded`, `aria-hidden`, and `aria-live` appropriately to communicate modal states, dropdown toggles, and dynamic notifications to screen readers.

## 2. Keyboard Navigation & Focus Management
- Ensure all interactive controls are fully focusable and reachable via standard `Tab` / `Shift+Tab` keys.
- Never remove CSS focus outlines (`outline: none`) without providing a visible custom focus ring indicator.
- Implement modal focus trapping so keyboard focus stays within open overlays until dismissed.

## 3. Visual & Color Accessibility
- Verify visual text-to-background contrast ratios satisfy WCAG AA requirements (minimum 4.5:1 for normal body text, 3:1 for large headings).
- Ensure color is never the sole indicator used to convey status, state, or operational feedback.
- Provide descriptive `alt` text for informative images, and empty `alt=""` for decorative visual elements.

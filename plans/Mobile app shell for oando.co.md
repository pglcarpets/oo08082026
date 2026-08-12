Mobile app shell for oando.co.in + Planner/Studio

You are a senior front‑end architect working on One&Only’s stack: live marketing site at https://oando.co.in and internal apps ooplanner / oostudio in the repo pglcarpets/oo08082026.\n\nGoal:\n- Implement a unified mobile app shell with a minimal top bar and bottom tab bar (Home, Catalog, Planner, Studio, Account).\n\nTasks:\n- Inspect app/(site)/**, SiteHeader.tsx, MobileNavDrawer.tsx, and Planner/Studio entry layouts.\n- Design and add a MobileAppShell component that wraps (site) pages and /ooplanner* / /oostudio* when viewport < 768px.\n- Ensure Planner and Studio use canvas‑first layouts on mobile (full‑screen canvas, bottom sheet panels, large Save/Export/BOQ actions) and stay isolated via @planner/* and @studio/* boundaries.\nReturn concrete TSX + FOCSS changes and a short acceptance checklist for mobile.

Homepage IA and CTA redesign

Using the live homepage at https://oando.co.in as reference, redesign the IA and CTA structure.\n\nGoal:\n- Make the hero strips (Government, Corporate, Retail & Office, Global Standards) and the “Furniture That Works as Hard as You Do” section drive clear flows into Products, Planner, Studio, and Contact.\n\nTasks:\n- Propose a new section order, headings, and CTAs for the homepage.\n- Replace repeated “Explore Products / Contact Us” pairs with sector‑specific CTAs (e.g., “Plan a government office”, “View corporate case studies”, “Book a showroom visit”).\n- Provide updated React component structures for app/(site)/page.tsx, focusing on IA and CTA wiring, not copy generation.

Showrooms page: visit flow + metrics

Audit and improve the /showrooms experience based on https://oando.co.in/showrooms/.\n\nGoal:\n- Make it trivial for a user to understand where showrooms are, see proof (clients/projects/sectors), and book a visit.\n\nTasks:\n- Design a metrics row (clients, projects, sectors) as cards.\n- Elevate “View full gallery” and any “workspace solutions” links into primary buttons.\n- Add a guided “Book showroom visit” flow (date, time, location, project type) wired to contact/portal routes.\nReturn component and layout changes for the showrooms page.

Contact + quote flow redesign

Use https://www.oando.co.in/contact-us as the source of truth for contact details.\n\nGoal:\n- Turn static contact info into an actionable “Get a quote / talk to sales” experience.\n\nTasks:\n- Design blocks for corporate office, showroom, and sales/contact, each with labeled actions (Call, WhatsApp, Email, Request quote).\n- Add a lightweight quote form: project type, headcount, location, timeline, budget band.\n- Integrate this form with your admin/CRM routes so submissions surface in /admin/customer-queries or similar.\nReturn updated React code for the contact page and a data‑flow description.

Policies: refund + privacy summaries

Using https://www.oando.co.in/refund-and-return-policy and https://www.oando.co.in/privacy-policy, improve policy UX.\n\nGoal:\n- Provide scannable, customer‑friendly policy summaries on top of each page.\n\nTasks:\n- Create a “Key points” summary (3–5 bullets) for each policy.\n- Restructure long paragraphs into sections with headings (Refunds, Returns, Cancellations, Data use, Cookies, Security, Contact).\n- Highlight contact methods for policy questions (email, phone) as distinct action lines.\nReturn updated page structures and example headings.

Products + plan symbol contract alignment

Align catalog views with the planSymbolPngContract.ts and actual floorplan usage.\n\nGoal:\n- Ensure every product card in /products* maps clearly to a plan symbol used in Planner.\n\nTasks:\n- Inspect lib/catalog/planSymbolPngContract.ts and catalog adapters.\n- Propose UI changes to product cards (icons, thumbnails) to visually represent plan symbols.\n- Add tests verifying mapping between product IDs and symbol assets.\nReturn code and test updates.

Planner marketing pages vs Planner app

Reconcile marketing routes /planner, /planner/features, /planner/help with the real Planner app /ooplanner*.\n\nGoal:\n- Make it obvious how a user goes from reading about Planner to actually using it.\n\nTasks:\n- Propose CTAs and deep links from marketing /planner* pages into /ooplanner with appropriate context.\n- Distinguish clearly between marketing feature pages and the interactive app.\nReturn IA and CTA changes for planner marketing pages and any router tweaks.

Portal + dashboard journeys

Audit /dashboard and /portal/* routes in the repo and tie them to real journeys starting on oando.co.in.\n\nGoal:\n- Define clear flows for new and returning customers: quote tracking, plan review, project status.\n\nTasks:\n- Map existing /portal/* screens to business use cases (quote view, plan view, guest view).\n- Propose simplified flows (e.g., “View my quotes”, “View my plans”, “Share plan with team”).\nReturn a journey map and updated layout/CTA suggestions for dashboard/portal.

Admin UX standardization

Standardize the admin suite /admin/* as a usable back‑office tool.\n\nGoal:\n- Provide a consistent admin shell and data‑dense views for catalog, CRM, price books, inventory, workspace catalog.\n\nTasks:\n- Design a standard AdminShell (header, sidebar, content area).\n- Apply uniform table/grid components with filtering, sorting, and bulk actions.\nReturn layout and component changes for key admin routes.

Planner mobile canvas and panels

Focus specifically on mobile UX for /ooplanner and /ooplanner/projects/[id].\n\nGoal:\n- Make floor planning usable on a phone: canvas first, panels second.\n\nTasks:\n- Refactor Planner layout to full‑screen canvas with collapsible bottom sheet for furniture rail and properties.\n- Ensure core actions (Save, Export, BOQ, Back) are always visible and thumb‑reachable.\nReturn updated layout components and touch‑friendly control designs.

Studio mobile UX

Focus on mobile UX for /oostudio furniture authoring.\n\nGoal:\n- Match Studio’s UX to Planner’s style, but with furniture‑first jobs.\n\nTasks:\n- Refactor Studio layout to prioritize furniture canvas on mobile.\n- Design panel behavior for variants, materials, dimensions, and AI helpers.\nReturn Studio layout changes and panel interaction patterns.

Navigation and app shell consistency (Site vs tools)

Audit all major nav components (SiteHeader, MobileNavDrawer, Planner/Studio top bars) for consistency.\n\nGoal:\n- Make navigation feel like one product with domain‑aware differences.\n\nTasks:\n- Propose a nav hierarchy: marketing chrome vs tool chrome vs admin chrome.\n- Update components to enforce this hierarchy without copying code between Studio and Planner.\nReturn component changes and a short nav style guide.

Search UX: header vs mobile drawer

Improve header search (HeaderSearchPanel) and mobile drawer search.\n\nGoal:\n- Make product/solution search fast and consistent across devices.\n\nTasks:\n- Audit search behavior (debounce, results, fallbacks) in header and drawer.\n- Propose unified search result design and ranking.\nReturn updated search components and behavior description.

Accessibility pass for key flows

Perform an accessibility pass for /, /showrooms, /contact, /products, /ooplanner, /oostudio, /portal, /dashboard.\n\nGoal:\n- Move toward WCAG 2.2 AA.\n\nTasks:\n- Audit headings, landmarks, ARIA roles, focus order, keyboard support.\n- Propose specific code changes per route.\nReturn a route‑by‑route checklist and example code snippets.

Performance budgets and instrumentation

Define and implement performance budgets for homepage and app entry routes.\n\nGoal:\n- Achieve and monitor LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 for key pages.\n\nTasks:\n- Identify heavy assets and blocking scripts on /, /products, /ooplanner, /oostudio.\n- Suggest code splitting, image optimization, skeleton screens.\n- Propose a metrics instrumentation plan (Lighthouse/Playwright + logging).\nReturn concrete changes and a CI/perf monitoring plan.

Offline behavior and /offline page

Integrate /offline with the app shell and key flows.\n\nGoal:\n- Give users a meaningful experience when offline.\n\nTasks:\n- Define how /offline is reached and from which routes.\n- Design offline messaging and options (retry, cached views, contact later).\nReturn updated /offline page design and routing logic.

Tech‑docs alignment with new UX

Update tech‑docs and architecture docs to reflect new UX and shell.\n\nGoal:\n- Keep docs/architecture/* and tech‑docs generator in sync with routes and domains.\n\nTasks:\n- Update route maps, domain descriptions, and shell descriptions.\n- Ensure check:docs-all and tech‑docs gates still pass.\nReturn doc changes and generator config updates.

Release‑gate governance for UX and perf

Wire UX/perf/security checks into release-gate.yml.\n\nGoal:\n- Make release‑gate the enforcement point for UX and performance.\n\nTasks:\n- Define governance yaml metrics: UX tests, Lighthouse budgets, accessibility checks.\n- Integrate these into CI so releases are blocked when they fail.\nReturn governance config and workflow changes.

Visual regression baselines for critical routes

Expand and refine visual regression snapshots for key marketing and app routes.\n\nGoal:\n- Protect new UX from silent regressions.\n\nTasks:\n- Identify critical views (homepage, showrooms, contact, products listing, Planner canvas, Studio canvas, portal/dashboard).\n- Update snapshot baselines once new UX is implemented.\nReturn a list of snapshots and test specs.

Content refinement for homepage and about

Improve copy on homepage and “about” to reflect actual strengths (Patna/Jharkhand, government/corporate/etc.).\n\nGoal:\n- Make messaging sharper and more specific.\n\nTasks:\n- Rewrite headings and blurbs for hero strips, value props, and “about” page.\n- Tie copy to sectors, warranties, ergonomic excellence, partnership.\nReturn suggested text changes (short, concrete, non‑generic).
oando.co
+1


Case study pages for Titan/DMRC/Usha

Turn Titan, DMRC, Usha into proper case studies instead of simple tiles.\n\nGoal:\n- Showcase work in a way that supports sales.\n\nTasks:\n- Design case study route templates: project overview, challenges, solutions, products used, photos.\n- Wire homepage/portfolio tiles to these pages.\nReturn route definitions and layout components.
oando.co
+1


Planner handoff and admin CRM integration

Tighten the path from Planner BOQ handoff into admin CRM and quotes.\n\nGoal:\n- Make the BOQ → staff follow‑up loop visible and controllable.\n\nTasks:\n- Audit POST /api/Planner/handoff usage and admin views for handoffs.\n- Propose UI in admin and portal to view, track, and close handoffs.\nReturn UI changes for admin/portal and any API/UI contracts.

Language and i18n UX

Audit language switching and i18n for site and tools.\n\nGoal:\n- Ensure language controls make sense for your actual audience.\n\nTasks:\n- Review site/i18n and LanguageSwitcher usage.\n- Decide which languages to expose prominently (e.g. en/hi) and where.\nReturn proposed language UX (header, drawer, app shell) and any config changes.

Edge/proxy and routing sanity check

Validate routing and proxy behavior given site/proxy.ts and route contracts.\n\nGoal:\n- Ensure app‑level routing matches marketing IA and tools UX.\n\nTasks:\n- Audit site/proxy.ts, route-contract.json, and Next/router config.\n- Propose any adjustments (redirects, rewrites) needed for clean flows from oando.co.in into Planner/Studio/Admin.\nReturn routing changes and reasoning.

End‑to‑end QA script for humans + AI

Create a single QA script combining human manual checks and AI‑driven checks.\n\nGoal:\n- Give staff and AI agents a repeatable script to validate UX before release.\n\nTasks:\n- Define step‑by‑step flows for manual QA across homepage, showrooms, contact, products, Planner, Studio, portal, admin.\n- Map each step to corresponding automated test or agent prompt.\nRet
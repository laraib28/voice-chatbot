# ADR-001: Frontend & Deployment Stack

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together.

- **Status:** Accepted
- **Date:** 2026-06-02
- **Feature:** Platform-wide (all features)
- **Context:**
  The AI Learning Assistant Platform requires a modern, type-safe, SEO-capable
  frontend that supports App Router-style routing (nested layouts, server components),
  mobile-first responsive design, and a consistent component library. The platform
  must be deployed to a globally distributed edge network with zero-config CI/CD.
  The team defaults to TypeScript for type safety. The UI must be beginner-friendly
  and accessible (WCAG 2.1 AA), which requires a well-maintained component system.

## Decision

All frontend and deployment concerns are handled by the following integrated cluster:

- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS v3 (utility-first; mobile-first by convention)
- **Component Library**: shadcn/ui (accessible, unstyled Radix UI primitives + Tailwind)
- **Deployment**: Vercel (native Next.js hosting; edge network; preview deployments per PR)

These four technologies are treated as a single cluster: they are designed to work
together, share the same release cadence assumptions, and would likely be replaced
as a unit rather than individually.

## Consequences

### Positive

- **Integrated DX**: Next.js + Vercel is the reference deployment path; zero custom
  CI/CD configuration required for preview and production deploys.
- **Server Components**: App Router enables data fetching close to the database on
  the server, reducing client-side bundle size and improving LCP.
- **Type safety**: TypeScript across the full frontend eliminates a class of runtime
  errors in API shape mismatches with Supabase clients.
- **Accessible by default**: shadcn/ui is built on Radix UI primitives, which handle
  keyboard navigation, ARIA roles, and focus management out of the box.
- **Tailwind consistency**: Utility classes enforce a consistent design token system
  without a separate design system build step.
- **Preview URLs**: Vercel generates per-PR preview deployments, enabling non-technical
  stakeholders to review UI changes before merge.

### Negative

- **Vercel lock-in**: Edge functions and some Next.js features (ISR, Image Optimization)
  are tightly coupled to Vercel infrastructure. Migrating to self-hosted or another
  CDN would require rework.
- **Next.js complexity**: App Router adds mental overhead (server vs client components,
  streaming, caching layers) compared to a simpler SPA.
- **Tailwind verbosity**: Utility-class HTML becomes verbose; consistent abstraction
  via components is required to keep templates readable.
- **shadcn/ui copy-paste model**: Components are vendored into `src/components/ui/`,
  meaning upstream shadcn updates require manual merges, not a package upgrade.

## Alternatives Considered

### Alternative A: Remix + styled-components + Fly.io
- Remix offers similar server rendering with a simpler data loading model.
- styled-components provides scoped CSS-in-JS.
- Fly.io offers more deployment flexibility.
- **Rejected because**: Vercel's native Next.js support, Tailwind's mobile-first
  utility approach, and shadcn/ui's accessibility guarantees deliver higher velocity
  with lower configuration overhead. Remix has a smaller ecosystem for AI/voice UI
  patterns.

### Alternative B: Vite SPA + Tailwind + Netlify (no SSR)
- Simpler mental model; pure client-side rendering.
- **Rejected because**: Voice and chat UI benefit from server-rendered initial state
  (faster first contentful paint) and server components reduce the JS shipped to the
  client. SEO for course landing pages also requires SSR.

### Alternative C: Create React App / Vite + MUI
- MUI (Material UI) is a mature, comprehensive component library.
- **Rejected because**: MUI's opinionated Material Design aesthetic requires significant
  theming to achieve a clean, modern educational look. Tailwind + shadcn/ui gives
  more design control with less override complexity.

## References

- Feature Spec: N/A (platform-level decision, pre-dates first feature spec)
- Implementation Plan: N/A (pre-dates first feature plan)
- Constitution: `.specify/memory/constitution.md` v1.0.0 (Technical Standards section)
- Related ADRs: ADR-002 (AI Voice Engine & Backend Platform)
- Evaluator Evidence: `history/prompts/constitution/001-initial-constitution-ratification.constitution.prompt.md`

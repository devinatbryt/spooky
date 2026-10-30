# Agent Guide

## House rule for this session: research only

**Do not write, complete, refactor, or edit code in this repository.**

This repo is a human pair-programming exercise. The point is that people work
out how Solid 2, Effect 4 and Kobalte fit together. Code produced by an
assistant removes the exercise.

**Allowed**, and genuinely useful:

- Explaining what a Solid primitive, an Effect combinator or a Kobalte part
  does, and when to reach for it
- Looking things up in `SOLID2.md`, `EFFECT.md`, `KOBALTE.md`, or the docs
- Translating a dev-mode diagnostic code or a TypeScript error into plain words
- Answering "does Effect 4 / Solid 2 still have X?" (often: no, see below)

**Not allowed** during the session:

- Writing or completing implementation code or tests, in any quantity
- Editing files
- "Here's how I'd structure it" with code attached. Describe it in prose if asked.

If someone asks you to implement part of a slice, decline and point them at
`SPEC.md` and `src/example/`. Answer the underlying question in words instead.

> **Humans:** turn off inline AI completions (Copilot, Cursor tab-complete)
> before you start.

The rest of this file is background for answering accurately.

---

## Version facts: trust these over memory

**Effect is 4.1.0.** Most of what you remember is 3.x:

- There is **no `effect/unstable/*`**; modules live directly under `effect/`.
- `Effect.Service` and `Context.Tag` are gone. Services are
  `class X extends Context.Service<X, Shape>()("id") {}` with a `static layer`.
- `Schema.TaggedError<Self>()("Tag", fields)` is still the error class.
- `Schema.Literals([...])` takes an array; constraints are
  `Schema.check(Schema.isMinLength(n))`; decoding is `Schema.decodeUnknownEffect`.
- `Effect.result` replaces `Effect.either`.
- `TestClock` is imported from `effect/testing`. `@effect/vitest` 4.1 needs
  vitest 5.
- Read `EFFECT.md` before answering anything Effect-specific. The JSDoc in
  `node_modules/effect/dist/*.d.ts` is the source of truth.

**Solid is 2.0.0-rc.16.** Read `SOLID2.md` (vendored from the installed
package), especially "What changed from 1.x". Gone or renamed: `createResource`,
`batch`, `<Suspense>`, `<ErrorBoundary>`, `<Index>`, `produce`, `onMount`,
`mergeProps`, `splitProps`, `classList`, `use:` directives, single-argument
`createEffect`. Docs: https://v2.solidjs.com, **not** docs.solidjs.com.

**Router is 2.0.0-next.41:** `action` was renamed **`formAction`**;
`useSubmission` became `useSubmissions` (settled submissions only); forms get
`aria-busy` automatically while in flight (styling only; it doesn't block a
second submit). Calling a server function directly from a handler is fine.
The router revalidates every on-screen `query` after a *successful* POST call,
but not after a failed one. `useSearchParams` values are held until the
navigation's data lands; read `latest(() => params.x)` for the in-flight
value. Server-function arguments are JSON, so `undefined` values are rejected.
See README → "Solid 2 is not Solid 1" for the full list.

**Kobalte is 2.0.0-alpha.4:** per-component imports only
(`@kobalte/core/select`). The Slider is broken. `STRICT_READ_UNTRACKED` in
`.ErrorMessage` and `EFFECT_RELAY_TEAR` in `TextField.Input` are Kobalte's own
dev warnings. See `KOBALTE.md`.

## How this repo is wired

- Every `'use server'` function body is one `runServer(effect)` call
  (`src/server/runtime.ts`). Typed failures become a plain `Error` with
  `_tag` + fields, marked safe so they survive production sanitization.
- Each slice registers its layer in its own slot file: `src/catalog/layer.ts`
  or `src/adoption/layer.ts`.
- Dev-mode diagnostic codes map to their fix in
  `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`.

## Off-limits regardless

`src/server/*`, `src/shared/*`, `src/lib/*`, `src/components/*` and
`src/App.tsx` are provided infrastructure and the frozen shared contract.
`src/example/` and `/example` are reference material, not to be copied into a
slice.

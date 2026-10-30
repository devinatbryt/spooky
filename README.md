# 🎃 Spooky: the Monster Adoption Agency

A two-hour pair-programming jam on **Solid 2.0 RC**, **Effect 4** and
**Kobalte**. Two pairs, **two different slices** of one app, merged at the end.

| Pair | Slice | Start at |
|---|---|---|
| Keegan & Grant | **The Catalog**: browse, search, filter | `SPEC.md` → The Catalog |
| Devin & Gabriel | **The Adoption Desk**: apply to adopt | `SPEC.md` → The Adoption Desk |

Each slice has a **backend** half (an Effect service) and a **frontend** half
(Solid 2 + Kobalte + Tailwind). What's already here is the boring part:
the runtime bridge, the shared data, a flaky third-party API, the Chaos
Panel, and one worked example. The agency itself is yours.

## House rule: no AI writing code

Assistants are for **research only**: looking things up, explaining a
primitive or an Effect combinator, decoding a diagnostic. Not for writing,
completing or refactoring code. **Turn off inline completions** (Copilot,
Cursor tab, and the like) before you start. `AGENTS.md` says this in the form an
assistant reads.

---

| File | What it is |
|---|---|
| **`SPEC.md`** | What to build, per slice and per rotation. Behaviour only. |
| **`EFFECT.md`** | Effect 4.1 cheatsheet, including the v3→v4 traps the internet will walk you into. |
| **`KOBALTE.md`** | Imports, component anatomy, styling, known alpha bugs. |
| **`SOLID2.md`** | The full Solid 2 cheatsheet, vendored from the installed rc.16. |
| **`DESIGN.md`** | Tailwind class strings, so nobody bikesheds spacing. |
| **`src/example/` + `/example`** | One Effect service end to end, on pumpkins. Copy the shape, not the code. |

## Setup

Requires **Node ≥ 22.19** (Effect 4 needs it; `.nvmrc` pins 22.20.0) and **pnpm**.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm test         # vitest 5 + @effect/vitest: every service test
pnpm typecheck    # tsc --noEmit
pnpm lint         # oxlint
pnpm build        # streaming SSR build to dist/; `pnpm start` serves it
```

Branch off `main` at the start, and stay in your folders (see `SPEC.md`):

```bash
git switch -c catalog/keegan-grant      # or adoption/devin-gabriel
```

## How the pairing works

The driver types; the navigator reads the spec and docs, thinks ahead, and
doesn't touch the keyboard. **Swap every 30 minutes.**

| Rotation | Both pairs |
|---|---|
| 1 (0–30) | **Backend.** The Effect service, its Schema and typed errors; turn the `it.todo`s into passing tests. |
| 2 (30–60) | **First screen.** Server functions and the page, with Kobalte. |
| 3 (60–90) | **The hard part.** Catalog: URL-synced filters. Desk: retries, timeout, the race. |
| 4 (90–120) | **Stretch: make it honest** at 1500ms / 30%, then a bonus. Rotations 1–3 are a complete result. |
| +15 min | **Merge both branches into `main` and walk through the demo** (`SPEC.md` → Definition of done). |

---

## How the pieces connect

```
browser ──'use server' fn──▶ runServer(effect) ──▶ your service ──▶ MonsterRepo ──▶ Chaos
                                 │                        └──────▶ BackgroundCheck (Desk only)
                                 └─ typed failure ──▶ plain Error { _tag, message, …fields } ──▶ isTagged(err, "…")
```

- **Every `'use server'` body is one line:** `return runServer(Service.use((s) => s.method(...)))`.
  Validation, rules and state live in the service.
- **Register your service** in your slot file, `src/catalog/layer.ts` or
  `src/adoption/layer.ts`, and nowhere else. That's what keeps the merge clean.
- **Typed failures** reach the browser as `{ _tag, message, ...fields }`: in an
  `<Errored>` fallback for reads, and on a submission's `.error` for form
  actions. Switch on `_tag`.

## The Chaos Panel

Bottom right of every page. **Latency** delays every `MonsterRepo` call;
**write failure** makes `MonsterRepo.save` fail with `ChaosRejected`.
Settings are process-wide (both windows share them) and reset when the server
restarts. At 0ms every loading and error state in this app is invisible, so
turn it up before you trust anything.

The `BackgroundCheck` is flaky **on its own**, independent of the panel.

---

## Solid 2 is not Solid 1, and Effect 4 is not Effect 3

Ask an assistant to *write* this stack and you get Solid 1 and Effect 3. The
ones that bite first:

1. **`createEffect` takes two functions**, `(compute, apply)`. Whatever
   `apply` returns is treated as a cleanup.
2. **Read async through `createMemo`:** `const monsters = createMemo(() => search(params()))`,
   under a `<Loading>`. `createResource`, `<Suspense>` and `<ErrorBoundary>`
   are gone.
3. **Props are values, never destructure them.** No `classList`; use
   `class={["a", { b: cond }]}`.
4. **Router:** `action` is now **`formAction`**, and `useSubmission` is now
   `useSubmissions(...)`, which holds *settled* submissions. A form bound to a
   form action gets `aria-busy` while in flight, so style it with
   `group-aria-busy:`.
5. **`useSearchParams` is held until the new data lands.** After
   `setSearchParams({ page: 2 })`, `params.page` (and even the address bar)
   still shows the *old* value until the page's data for page 2 has loaded:
   about 1.5s at 1500ms latency. A control bound to `params.page` therefore
   looks frozen. Bind controls to **`latest(() => params.page)`** (from
   `solid-js`), which shows the in-flight value, and let the grid show stale
   results with `isPending`.
6. **Server-function arguments travel as JSON.** An object with an
   `undefined` value (`{ species: undefined }`) is rejected as "not
   JSON-serializable". The first SSR render calls the function directly, so it
   works on reload and breaks only on client-side navigation. **Leave absent
   keys out** rather than setting them to `undefined`.
7. **A server call that *fails* revalidates nothing.** A successful POST
   refreshes every `query` on screen; a failed one doesn't. If a failure
   means your screen is now out of date (`AlreadyAdopted`: someone else
   changed that monster), call `revalidate(getThing.keyFor(id))` yourself.
8. **`aria-busy` is styling, not a lock.** It doesn't stop a second submit
   (Enter in a field, a fast double click). Guard double submits yourself.
9. **Form-action hooks live and die with their component.** An
   `.onSettled(...)` registered inside a component that success *unmounts*
   (the form, replaced by "Adopted!") never fires for that success. Register it
   in a parent that stays mounted.
10. **Effect:** no `effect/unstable/*`, no `Effect.Service`. Services are
    `Context.Service`. See `EFFECT.md` → The traps.

## Known rough edges (none of these are your bug)

- **Kobalte's Slider is broken** in alpha.4. Everything else you need works;
  see `KOBALTE.md`.
- **Kobalte logs several Solid diagnostics of its own** in the dev console
  (`STRICT_READ_UNTRACKED`, `EFFECT_RELAY_TEAR`, `EFFECT_WRITES_OWN_SOURCE`
  from TextField, Tabs and Select). They're harmless; `KOBALTE.md` lists them.
- **`LONG_HOLD` warnings at high latency are expected.** At 1500ms the
  router holds a navigation long enough for Solid to mention it. That's the
  Chaos Panel doing its job.
- **Don't put `<Title>` inside a `<Loading>`.** Under streaming SSR it causes
  a hydration key miss. Put it at the top of the page component, outside any
  boundary.
- **A typed failure is an HTTP 500**, so the browser console logs
  "Failed to load resource: 500" for every rejected form submission. That's
  the transport, not a crash.
- **In production builds**, Solid replaces thrown server errors with a generic
  one unless they're marked safe. `runServer` already does this
  (`markSafeError`). If you ever throw from a server function *without*
  `runServer`, your `_tag` vanishes in `pnpm build` but not in `pnpm dev`.
- **"Failed to fetch dynamically imported module: …/node_modules/.vite/deps/…"**
  means the tab is older than the dev server. After `pnpm dev` restarts (or
  re-bundles its dependencies), an open tab keeps its old dependency version
  stamp. Everything it already loaded keeps working, so the first *lazy*
  import (often the first form submit) is what fails, with a 504. Hard-reload
  the tab (Ctrl/Cmd+Shift+R).
- **`curl` gets a 404 from the dev server** unless you send `Accept: text/html`.
- **`latest` npm tags lie:** `solid-js@latest` is 1.9. Every version is pinned
  exactly and the lockfile is committed. Don't run `pnpm update`.

## Stack

`solid-js` / `@solidjs/web` **2.0.0-rc.16** · `@solidjs/router` 2.0.0-next.41 ·
`@solidjs/vite-plugin` 3.0.0-next.51 (start mode: streaming SSR, `'use server'`)
· `effect` **4.1.0** · `@kobalte/core` **2.0.0-alpha.4** · Tailwind 4.3 ·
Vite 8 · Vitest 5. Not SolidStart, which is still Solid 1.

Solid docs: **https://v2.solidjs.com** (`docs.solidjs.com` is 1.x and will
mislead you). Effect: https://effect.website (cross-check against `EFFECT.md`).
Kobalte: https://kobalte.dev.

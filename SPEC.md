# SPEC — the Monster Adoption Agency

Two pairs, **two different slices** of one app. Each slice has a backend
half (Effect) and a frontend half (Solid 2 + Kobalte). At the end both
branches merge into `main` and the joined app is the demo.

| Pair | Slice | Lives in | Branch |
|---|---|---|---|
| Keegan & Grant | **The Catalog**: browse, search, filter | `src/catalog/`, `src/routes/monsters/` | `catalog/keegan-grant` |
| Devin & Gabriel | **The Adoption Desk**: apply to adopt | `src/adoption/`, `src/routes/adopt/` | `adoption/devin-gabriel` |

This spec describes **behaviour**. Which primitive, which Effect combinator and
which Kobalte part you use is the exercise.

**Rotations 1–3 are a complete result.** Rotation 4 is a stretch: do it if
you get there, and don't rush 1–3 to reach it.

---

## The shared contract (frozen on `main`)

Neither pair edits these on their branch. If one is wrong, say so out loud.

- **`src/shared/monster.ts`**: the `Monster` schema and type, `Species`,
  `Housing`, display labels, and `adoptPath(id)`.
- **`src/shared/errors.ts`**: `MonsterNotFound`, `ChaosRejected`, and the
  browser-side helpers `isTagged` / `tagOf`.
- **`src/server/monster-repo.ts`**: `MonsterRepo` with `list`, `get(id)` and
  `save(monster)`. 24 seeded monsters, 4 per species; 4 are already adopted.
  **`save` is not atomic with `get`**, and last write wins.
- **`src/server/background-check.ts`**: `BackgroundCheck.run(name)`. It takes
  200–1200ms and fails about 40% of the time with `BackgroundCheckFlaked`. It
  is deliberately unreliable; that is the Desk's problem to solve.
- **`src/server/runtime.ts`**: `runServer(effect)`, the only bridge between a
  `'use server'` function and Effect.
- **The URL contract:** the Catalog links to `/adopt/:monsterId` (use
  `adoptPath(id)`) from day one; the Desk serves it. That is why the merge
  needs no glue code.

```ts
type Species = 'vampire' | 'werewolf' | 'ghost' | 'zombie' | 'witch' | 'mummy'
type Housing = 'apartment' | 'house-with-yard' | 'haunted-mansion' | 'crypt'

interface Monster {
  id: string                       // 'mon_01'
  name: string                     // 'Count Snackula'
  species: Species
  emoji: string                    // '🧛'
  age: number
  bio: string
  status: 'available' | 'adopted'
  adoptedBy: string | null
  adoptedAt: number | null
}
```

**The only shared file you may edit is your own layer slot:**
`src/catalog/layer.ts` (Catalog) or `src/adoption/layer.ts` (Desk). Register
your service's layer there. Never edit `src/server/runtime.ts`.

---

## The Catalog — Keegan & Grant

A place to browse every monster, narrow the list down, and click through to
one.

### Rotation 1: the service (backend)

- [ ] A `MonsterCatalog` service in `src/catalog/`, registered in
      `src/catalog/layer.ts`, built on `MonsterRepo`.
- [ ] **Search** takes *untrusted* input (URL search params are strings) and
      decodes it with a Schema: an optional name query, an optional species,
      a status of all / available / adopted (default all), and a page (≥ 1,
      default 1).
- [ ] It returns one page of **8** monsters plus enough to draw a pager: the
      total match count and the page count.
- [ ] A name search is case-insensitive and matches part of a name.
- [ ] Input that does not decode (`species=dragon`, `page=0`, `page=1.5`,
      `page=abc`) fails with a typed **`InvalidSearch`** error. A page must
      be a whole number ≥ 1. A page past the end is *not* an error; it is
      just empty.
- [ ] **Detail** returns one monster by id, or fails with `MonsterNotFound`.
- [ ] Every `it.todo` in `src/catalog/catalog.test.ts` is a real passing test.

### Rotation 2: first screen (frontend)

- [ ] Server functions for search and detail, each body one `runServer(...)`.
- [ ] `/monsters` renders a grid of cards: emoji, name, species, age, and an
      available/adopted badge. A card links to `/monsters/:id`.
- [ ] The first load shows a **deliberate** loading state (skeleton cards),
      not a blank page and not a layout jump.
- [ ] A search that matches nothing says so rather than rendering nothing.
- [ ] `/monsters/:id` shows the monster, its bio, and an **Adopt** button
      linking to `adoptPath(id)`. It is disabled with "Already adopted" when the
      monster isn't available.
- [ ] An unknown id (`/monsters/mon_99`) shows a proper not-found state, not
      the app-wide error screen.

### Rotation 3: filters (the hard part)

- [ ] A **name search** box (Kobalte TextField) that narrows as you type,
      without firing a request per keystroke.
- [ ] A **species** filter (Kobalte Select) with "All species" plus the six.
- [ ] A **status** filter (Kobalte Tabs): All / Available / Adopted.
- [ ] A **pager** (Kobalte Pagination).
- [ ] **All filter state lives in the URL** search params. Reload keeps it,
      the back button steps through it, and a pasted link reproduces it.
- [ ] Changing any filter goes back to page 1.
- [ ] Hand-edit the URL to `?species=dragon`: you see an `InvalidSearch`
      message with a **Reset filters** button, not the app-wide error screen.

### Rotation 4 (stretch): make it honest

- [ ] Chaos Panel at **1500ms**. The first load shows skeletons; *changing a
      filter* keeps the current results on screen, visibly stale, until the
      new ones land. It never flashes back to skeletons.
- [ ] Typing quickly in the search box at 1500ms never shows results for an
      older query after a newer one.
- [ ] Then pick a bonus.

**Bonus:** sort (name / age); a "Monster of the Night" pick on `/monsters`;
species counts in the Select; swap `MonsterRepo` for SQLite
(`@effect/sql-sqlite-node`) without touching the service.

---

## The Adoption Desk — Devin & Gabriel

A form for adopting one monster, with rules, a flaky third party, and a race.

### Rotation 1: the service (backend)

- [ ] An `AdoptionDesk` service in `src/adoption/`, registered in
      `src/adoption/layer.ts`, built on `MonsterRepo` and `BackgroundCheck`.
- [ ] It takes a monster id plus *untrusted* form input and decodes it with a
      Schema:
  - **name**: trimmed, 2–40 characters
  - **housing**: one of the four `Housing` values
  - **keeps garlic**: a checkbox (on or absent)
  - **accepts being haunted**: a checkbox that **must** be on
- [ ] Bad input fails with **`InvalidApplication { field, reason }`**, where
      `field` names the form field so the UI can put the message next to it.
- [ ] Unknown monster → `MonsterNotFound`. Already adopted →
      **`AlreadyAdopted { adoptedBy }`**.
- [ ] Housing must suit the species, or it fails with
      **`ApplicationRejected { reason }`**:

  | Species | Acceptable housing |
  |---|---|
  | vampire | crypt, haunted mansion |
  | werewolf | house with a yard |
  | zombie | anything except an apartment |
  | mummy | crypt |
  | ghost, witch | anything |

- [ ] A vampire plus garlic → `ApplicationRejected`.
- [ ] On success the monster is saved with `status: 'adopted'`, `adoptedBy`
      and `adoptedAt`, and the adoption is returned.
- [ ] Rotation 1 uses a **fake** `BackgroundCheck` that always passes (see
      the comment in `background-check.ts`). The real flaky one is Rotation 3.
- [ ] The validation, rules, not-found and already-adopted `it.todo`s in
      `src/adoption/adoption.test.ts` are real passing tests.

### Rotation 2: the form (frontend)

- [ ] Server functions: one read (the monster being adopted) and one write
      (the application), each body one `runServer(...)`.
- [ ] `/adopt/:monsterId` shows who you're adopting (emoji, name, species),
      with a deliberate loading state and a proper not-found state for an
      unknown id.
- [ ] The form: name (Kobalte TextField), housing (Kobalte RadioGroup),
      garlic and haunting (Kobalte Checkbox ×2).
- [ ] An `InvalidApplication` shows **next to the field it names**. Any other
      failure shows as a toast (`showToast` in `src/components/toast.tsx`).
- [ ] Success shows a toast, and the page switches to an "Adopted by …"
      state. An already-adopted monster shows that state instead of the form.

### Rotation 3: the background check and the race (the hard part)

- [ ] The service calls the **real** `BackgroundCheck`. A flaked call is
      retried up to **3 times with exponential backoff**.
- [ ] The whole check is capped at **3 seconds**. Out of retries or out of
      time, it fails with **`BackgroundCheckUnavailable`**.
- [ ] **The race:** two applications for the same monster at the same moment
      → exactly one adopts it; the other gets `AlreadyAdopted`. The repo's
      `save` will not protect you.
- [ ] The three background-check `it.todo`s (retry, give up, time out with
      `TestClock`) and the race `it.todo` are real passing tests.
- [ ] Before submitting, a Kobalte **Dialog** asks "Adopt Count Snackula?
      This is permanent." Confirm submits; cancel does nothing.

### Rotation 4 (stretch): make it honest

- [ ] Chaos Panel at **1500ms / 30%**. While an application is in flight,
      the form shows it deliberately and cannot be submitted twice.
- [ ] A `ChaosRejected` save shows a toast, the monster is **still
      available**, and what you typed is still in the form.
- [ ] Two windows on the same monster, submit both within a second: one
      wins, the other is told who beat them.
- [ ] Then pick a bonus.

**Bonus:** a "flagged" background check (try applying as "Van Helsing")
rejects the application; show the background check's progress ("checking…
retrying…"); "My adoptions" on the home page; swap `MonsterRepo` for SQLite.

---

## Definition of done

**Each pair, on its own branch:** Chaos Panel at **1500ms / 30%**, and your
rotation 1–3 checklist works in front of the other pair.

**After the merge:** open `/monsters` → filter to vampires → open Count
Snackula → **Adopt** → fill in the form → confirm → back to the Catalog →
he's on the **Adopted** tab. If that walk-through works, the agency is open.

---

## Rules of engagement

1. **Stay in your folders.** Your slice folder, your route folder, your one
   layer file. That is what makes the merge free. The one exception is
   `file-routes.d.ts`, which the toolchain regenerates when a route starts
   exporting `route`. If it conflicts at the merge, take either side and run
   `pnpm build` to regenerate it.
2. **`src/example/` and `/example` are reference material.** Copy the
   *shape*, not the code. It is pumpkins on purpose.
3. **Turn the Chaos Panel up before you trust anything.** At 0ms every async
   state in this app is invisible, including the ones you got wrong.
4. **Server-side validation is the real validation.** The UI may help, but
   every rule above must hold when the request is hand-crafted.
5. When something won't update, read the diagnostic code in the console and
   look it up in `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`.
   When something won't compile, check `EFFECT.md` before blaming yourself.

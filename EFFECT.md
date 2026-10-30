# Effect 4 — the cheatsheet for this repo

Everything here was checked against the installed **`effect@4.1.0`** (released
2026-10-29). Effect 4 renamed a lot from 3.x, and most blog posts, docs pages
and AI answers are still 3.x. When they disagree with this file, this file
wins.

Read `src/example/pumpkin-patch.ts` and its test alongside this. They use
almost everything below, once.

---

## The traps (read these first)

| You'll see this online | In 4.1.0 it is |
|---|---|
| `import … from "effect/unstable/http"` (any `effect/unstable/*`) | **Does not exist.** Modules live directly under `effect/` (`effect/http`, `effect/rpc`, …). You won't need them here. |
| `class X extends Effect.Service<X>()("X", { … })` | **Gone.** `class X extends Context.Service<X, Shape>()("X") {}` plus a `static layer`. |
| `Context.Tag("X")` / `Context.GenericTag` | `Context.Service<Shape>("X")` (function form) or the class form above. |
| `Effect.either(effect)` | `Effect.result(effect)`: a `Result` with `_tag: "Success" \| "Failure"`. |
| `Schema.Literal("a", "b", "c")` | `Schema.Literals(["a", "b", "c"])` (one array). `Schema.Literal("a")` is a single literal. |
| `Schema.minLength(2)` in a `pipe` | `Schema.String.pipe(Schema.check(Schema.isMinLength(2)))` |
| `Schema.decodeUnknown(schema)` | `Schema.decodeUnknownEffect(schema)`, or `decodeUnknownSync` (throws). |
| `TestClock` from `effect` | `import { TestClock } from "effect/testing"` |
| `vitest` 3/4 | `@effect/vitest@4.1.0` needs **vitest 5** (installed). |

---

## The shape of an Effect

```ts
Effect.Effect<Success, Error, Requirements>
//            ^ what it gives  ^ how it fails (typed)  ^ services it needs
```

It's a *description* of work. Nothing runs until a runtime runs it, and in
this repo that's always `runServer(...)` (or `it.effect` in a test).

```ts
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const a = yield* someEffect;          // yield* unwraps an Effect
  if (a < 0) return yield* new Oops({}); // yield* a TaggedError fails with it
  return a * 2;
});
```

`Effect.fn("name")(function* (arg) { … })` defines a function that returns an
Effect, with a span name for traces. Use it for service methods.

---

## Services and layers

A **service** is a tag (the class) plus the shape of what it offers. A
**layer** is the recipe for building it.

```ts
import { Context, Effect, Layer } from "effect";

export class Greeter extends Context.Service<
  Greeter,
  { readonly greet: (name: string) => Effect.Effect<string> }
>()("spooky/Greeter") {
  static readonly layer = Layer.effect(
    Greeter,
    Effect.gen(function* () {
      const repo = yield* MonsterRepo;   // depend on another service
      return Greeter.of({ greet: (name) => Effect.succeed(`Boo, ${name}`) });
    }),
  );
}
```

Using it:

```ts
const greeter = yield* Greeter;                  // inside Effect.gen
Greeter.use((g) => g.greet("Ada"));              // one-liner, handy in server functions
```

Layers you'll touch:

- `Layer.effect(Tag, effect)` builds a service with an effect. Code in it runs
  **once**, when the layer is built, so put state (`Ref.make`) there.
- `Layer.succeed(Tag, Tag.of({...}))` builds a service from a plain value.
  **This is how you make fakes for tests.**
- `Layer.provide(dependencyLayer)` satisfies a layer's requirements.
- `Layer.mergeAll(a, b, c)` combines layers side by side.

Your slice registers its layer in its own slot (`src/catalog/layer.ts` or
`src/adoption/layer.ts`). `MonsterRepo`, `BackgroundCheck` and `Chaos` are
provided for you by the runtime.

---

## Typed errors

```ts
import { Schema } from "effect";

export class AlreadyAdopted extends Schema.TaggedError<AlreadyAdopted>()(
  "AlreadyAdopted",
  { monsterId: Schema.String, adoptedBy: Schema.String },
) {
  override get message() { return `${this.adoptedBy} got there first.`; }
}
```

- Fail: `return yield* new AlreadyAdopted({ ... })` inside `Effect.gen`, or
  `Effect.fail(new AlreadyAdopted({ ... }))`.
- The error type shows up in the signature: `Effect<Adoption, AlreadyAdopted | …>`.
- Recover from one tag: `Effect.catchTag("TimeoutError", (e) => …)`.
- Several: `Effect.catchTags({ A: …, B: … })`. Transform: `Effect.mapError`.
- Defects (bugs, `throw` inside `Effect.sync`) are **not** in the error type,
  and `runServer` reports them as a generic `Defect`.

**Across the wire:** `runServer` throws a plain `Error` carrying `_tag`,
`message` and the error's fields, and nothing else (no class, no stack). In
the browser, switch on `_tag` with `isTagged(error, "AlreadyAdopted")` from
`src/shared/errors.ts`. A getter for `message` gives each error a readable
sentence.

---

## Schema: validating untrusted input on the server

```ts
const Application = Schema.Struct({
  name: Schema.Trim.pipe(Schema.check(Schema.isMinLength(2), Schema.isMaxLength(40))),
  housing: Housing,                                   // a Literals schema
  page: Schema.optional(Schema.NumberFromString),     // "3" -> 3, may be absent
  agree: Schema.optional(Schema.NullOr(Schema.Literal("on"))),
  // ^ an HTML checkbox: "on" when ticked; form.get() gives null when not
});
type Application = typeof Application.Type;

Schema.decodeUnknownEffect(Application)(input)        // Effect<Application, SchemaError>
```

Useful pieces: `Struct`, `String`, `Number`, `Boolean`, `Literal`,
`Literals([...])`, `NullOr`, `optional`, `Trim`, `NumberFromString`, `Int`,
`check(...)` with `isMinLength`, `isMaxLength`, `isGreaterThanOrEqualTo`,
`isBetween`. `check` filters take `{ message: "…" }` as their last argument.

**Which field failed?** A `SchemaError` has an `issue`. Format it the Standard
Schema way and every issue gets a `path`. Its first segment is the field
name. `src/example/pumpkin-patch.ts` (`decodePick`) does exactly this.

```ts
import { SchemaIssue } from "effect";
const format = SchemaIssue.makeFormatterStandardSchemaV1();
const [first] = format(error.issue).issues;   // { message, path }
```

**FormData:** `form.get("x")` is `string | File | null`. A missing field (an
unticked checkbox, too) is **`null`, not `undefined`**, and `Schema.optional`
alone rejects `null`. Build a plain object from the fields you expect, and
wrap anything that can be absent in `Schema.NullOr(...)`.

---

## State and concurrency

```ts
const ref = yield* Ref.make(initial);
yield* Ref.get(ref);
yield* Ref.set(ref, next);
yield* Ref.update(ref, (s) => next);
const out = yield* Ref.modify(ref, (s) => [result, nextState] as const); // atomic read-decide-write
```

`Ref.modify` is atomic, **but only within one call**. A *read*, then an
`Effect.sleep` or another service call, then a *write* is not atomic. Anything
can happen in between, and with chaos latency and a 1-second background check
something will.

To make a multi-step section exclusive:

```ts
import { Semaphore } from "effect";

const lock = yield* Semaphore.make(1);                 // in your layer, once
const guarded = criticalSection.pipe(Semaphore.withPermit(lock));
```

Run things concurrently: `Effect.all([a, b], { concurrency: "unbounded" })`.

---

## Retries, backoff and timeouts

```ts
import { Schedule } from "effect";

flaky.pipe(
  Effect.retry({ schedule: Schedule.exponential("100 millis"), times: 3 }),
  // ^ up to 3 retries after the first try: 100ms, 200ms, 400ms apart
  Effect.timeout("3 seconds"),
  // ^ fails with a TimeoutError (_tag "TimeoutError") if it runs over
  Effect.catchTag("TimeoutError", () => Effect.fail(new MyOwnError({ … }))),
);
```

`Effect.retry` also takes `while: (error) => boolean` to retry only some
errors. **Order matters:** `timeout` *after* `retry` caps the whole thing;
before it, each attempt.

Durations are strings (`"3 seconds"`, `"250 millis"`) or `Duration.millis(n)`.

---

## Testing (`@effect/vitest`)

```ts
import { describe, expect, it } from "@effect/vitest";
import { Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";

it.effect("names the field", () =>
  Effect.gen(function* () {
    const desk = yield* AdoptionDesk;
    const error = yield* Effect.flip(desk.apply("mon_01", { name: "" }));  // flip: assert on the failure
    expect(error._tag).toBe("InvalidApplication");
  }).pipe(Effect.provide(TestLayer)),
);
```

- `it.effect` runs with a **TestClock**: `Effect.sleep` and timeouts do *not*
  pass on their own. To test a timeout, fork the work, move the clock, join:

  ```ts
  const fiber = yield* slowThing.pipe(Effect.flip, Effect.forkChild);
  yield* TestClock.adjust("3 seconds");
  const error = yield* Fiber.join(fiber);
  ```
- `TestClock.adjust` only fires sleeps that are **already scheduled** when you
  call it. Work that sleeps in stages (a slow fake, then a retry backoff, then
  another try) needs several smaller adjusts. For a test that's really about
  concurrency (the race), `it.live` runs on the real clock and is simpler.
- Build `TestLayer` from your real layer plus fakes. Use **`provideMerge`**
  so the test can still reach `Chaos` (for example, to turn latency up and
  widen a race window):
  `AdoptionDesk.layer.pipe(Layer.provideMerge(Layer.mergeAll(FakeCheck, MonsterRepo.layer)), Layer.provideMerge(Chaos.layer))`.
  Note: `MonsterRepo.layer` needs `Chaos`.
- A fake that fails twice then passes needs state: a `Ref` counter inside
  the fake's `run`.
- Each `it.effect` builds its layers fresh, so tests don't share monsters.

---

## The seam: `runServer`

```ts
export const getThing = query(async (id: string) => {
  "use server";
  return runServer(Thing.use((t) => t.get(id)));
}, "thing");
```

One line per server function. Validation, rules and state live in the
service, never in the server function.

Arguments to a server function are sent as **JSON**. An object holding an
`undefined` value is refused ("not JSON-serializable"), but only on
client-side calls, because the first SSR render calls the function directly.
Leave absent keys out. `runServer` only accepts effects whose
requirements the app runtime can satisfy, so a type error there usually means
"you forgot to register your layer in your slot file".

Docs: https://effect.website (written for 3.x in places, so cross-check
here). The source of truth is the JSDoc in `node_modules/effect/dist/*.d.ts`;
most functions there have a runnable example.

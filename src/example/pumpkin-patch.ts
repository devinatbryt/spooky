// THE WORKED EXAMPLE — one Effect service, start to finish, on a toy domain.
//
// Read this file top to bottom before you write your own service. It shows,
// once each:
//
//   1. a Schema that validates untrusted input on the SERVER
//   2. typed errors (Schema.TaggedError) — including field-level ones
//   3. a service defined with Context.Service, plus its Layer
//   4. a dependency on another service (Chaos) yielded inside the layer
//   5. state held in a Ref
//
// The server functions that expose it are in ./api.ts, the page is
// src/routes/example.tsx, and the tests are in ./pumpkin-patch.test.ts.
//
// Copy the SHAPE, not the code — it is pumpkins on purpose.
import 'server-only';

import { Context, Effect, Layer, Ref, Schema, SchemaIssue } from 'effect';

import type { ChaosRejected } from '../shared/errors';
import { Chaos } from '../server/chaos';

// ---------------------------------------------------------------------------
// 1. Schemas. `Type` is what you get after decoding; build types from them.
// ---------------------------------------------------------------------------

export const PumpkinSize = Schema.Literals(['small', 'medium', 'giant']);
export type PumpkinSize = typeof PumpkinSize.Type;

/** What a pick request must look like. Decoded from untrusted form input. */
export const PickRequest = Schema.Struct({
  size: PumpkinSize,
  pickedBy: Schema.Trim.pipe(
    Schema.check(
      Schema.isMinLength(2, { message: 'Tell us who you are (2+ characters).' }),
      Schema.isMaxLength(30, { message: 'Keep it under 30 characters.' }),
    ),
  ),
});
export type PickRequest = typeof PickRequest.Type;

export interface Pick {
  readonly size: PumpkinSize;
  readonly pickedBy: string;
  readonly remaining: number;
}

// ---------------------------------------------------------------------------
// 2. Typed errors. The tag is what the browser switches on; the fields travel
//    with it. A getter for `message` gives each one a human sentence.
// ---------------------------------------------------------------------------

/** Bad input. `field` names the form field so the UI can put the message next to it. */
export class InvalidPick extends Schema.TaggedError<InvalidPick>()('InvalidPick', {
  field: Schema.String,
  reason: Schema.String,
}) {
  override get message() {
    return this.reason;
  }
}

export class PatchEmpty extends Schema.TaggedError<PatchEmpty>()('PatchEmpty', {
  size: PumpkinSize,
}) {
  override get message() {
    return `No ${this.size} pumpkins left. Someone got there first.`;
  }
}

// ---------------------------------------------------------------------------
// 3. The service: a tag (the class) plus the shape of what it offers. Every
//    method returns an Effect, and its error type is part of the signature.
// ---------------------------------------------------------------------------

const STARTING_STOCK: Record<PumpkinSize, number> = { small: 5, medium: 3, giant: 1 };

export class PumpkinPatch extends Context.Service<
  PumpkinPatch,
  {
    readonly stock: Effect.Effect<Record<PumpkinSize, number>>;
    /** Takes UNTRUSTED input on purpose: validation is the service's job. */
    readonly pick: (input: unknown) => Effect.Effect<Pick, InvalidPick | PatchEmpty | ChaosRejected>;
    readonly replant: Effect.Effect<void>;
  }
>()('spooky/example/PumpkinPatch') {
  // -------------------------------------------------------------------------
  // 4. The layer: how to BUILD the service. It can yield other services
  //    (here, Chaos) — the runtime provides them. Its state (a Ref) is created
  //    once, when the layer is built, and shared by every call after that.
  // -------------------------------------------------------------------------
  static readonly layer = Layer.effect(
    PumpkinPatch,
    Effect.gen(function* () {
      const chaos = yield* Chaos;
      const stock = yield* Ref.make(STARTING_STOCK);

      const pick = Effect.fn('PumpkinPatch.pick')(function* (input: unknown) {
        // Decode first. Bad input never gets past this line.
        const request = yield* decodePick(input);

        // Chaos may delay or reject the write. Do it BEFORE touching state,
        // so a rejection leaves the patch exactly as it was.
        yield* chaos.write(`pick a ${request.size} pumpkin`);

        // Ref.modify is atomic: read, decide and write in one step, so two
        // simultaneous picks of the last giant pumpkin cannot both succeed.
        const remaining = yield* Ref.modify(stock, (current) => {
          const left = current[request.size];
          if (left === 0) return [-1, current] as const;
          return [left - 1, { ...current, [request.size]: left - 1 }] as const;
        });
        if (remaining < 0) return yield* new PatchEmpty({ size: request.size });

        return { size: request.size, pickedBy: request.pickedBy, remaining };
      });

      return PumpkinPatch.of({
        stock: chaos.read.pipe(Effect.andThen(Ref.get(stock))),
        pick,
        replant: Ref.set(stock, STARTING_STOCK),
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// 5. Turning a SchemaError into a field-level typed error. The Standard
//    Schema formatter gives every issue a `path` — its first segment is the
//    field name.
// ---------------------------------------------------------------------------

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();

const decodePick = (input: unknown) =>
  Schema.decodeUnknownEffect(PickRequest)(input).pipe(
    Effect.mapError((error) => {
      const [first] = formatIssues(error.issue).issues;
      const field = first?.path?.[0];
      return new InvalidPick({
        field: typeof field === 'object' ? String(field.key) : String(field ?? 'form'),
        reason: first?.message ?? 'That pick did not make sense.',
      });
    }),
  );

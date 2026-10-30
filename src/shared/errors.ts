// Typed failures that cross the server → browser boundary.
//
// On the server, a failure is a `Schema.TaggedError` class in the Effect
// error channel. `runServer` (src/server/runtime.ts) turns it into a plain
// Error carrying `_tag` and the error's fields — no class, no server stack —
// and throws it. So in the browser, wherever you catch it (an <Errored>
// fallback, a form submission's `.error`), you get `{ _tag, message, ...fields }`
// and you switch on `_tag`.
//
// Errors used by BOTH slices live here. Slice-specific errors belong in the
// slice's own folder.
import { Schema } from 'effect';

export class MonsterNotFound extends Schema.TaggedError<MonsterNotFound>()(
  'MonsterNotFound',
  { id: Schema.String },
) {
  override get message() {
    return `No monster with id "${this.id}" lives here.`;
  }
}

/** Thrown by the Chaos layer when the dice say so. Deliberate, not a bug. */
export class ChaosRejected extends Schema.TaggedError<ChaosRejected>()(
  'ChaosRejected',
  { label: Schema.String },
) {
  override get message() {
    return `The chaos monkey rejected "${this.label}". This failure is deliberate.`;
  }
}

/** What a typed failure looks like once it reaches the browser. */
export type WireError<Tag extends string = string> = Error & {
  readonly _tag: Tag;
  readonly [field: string]: unknown;
};

/** The `_tag` of anything thrown by a server function, if it has one. */
export function tagOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && '_tag' in error
    ? String((error as { _tag: unknown })._tag)
    : undefined;
}

/** Narrow an unknown thrown value to one specific typed failure. */
export function isTagged<Tag extends string>(
  error: unknown,
  tag: Tag,
): error is WireError<Tag> {
  return tagOf(error) === tag;
}

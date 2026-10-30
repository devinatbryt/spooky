// A pretend third-party "background check" API — provided infrastructure.
// The Adoption Desk calls it; the Catalog never does.
//
// It is DELIBERATELY unreliable, like every real third-party API:
//   - every call takes 200–1200ms
//   - about 40% of calls fail with BackgroundCheckFlaked (a transient error:
//     the same call a moment later may well succeed)
//
// Making it reliable enough to use — retries, backoff, a timeout — is the
// Desk's job, not this file's. Do not edit it to be less flaky.
//
// In tests, do not use `BackgroundCheck.layer` — build your own fake with
// `Layer.succeed(BackgroundCheck, BackgroundCheck.of({ run: ... }))` so the
// test decides exactly when it fails. See src/example/pumpkin-patch.test.ts
// for the pattern.
import 'server-only';

import { Context, Duration, Effect, Layer, Random, Schema } from 'effect';

export class BackgroundCheckFlaked extends Schema.TaggedError<BackgroundCheckFlaked>()(
  'BackgroundCheckFlaked',
  { applicantName: Schema.String },
) {
  override get message() {
    return 'The background check service hiccuped. Try again.';
  }
}

export interface BackgroundCheckReport {
  readonly applicantName: string;
  /** "flagged" means: do not hand this person a monster. */
  readonly verdict: 'clear' | 'flagged';
  readonly note: string;
}

const MONSTER_HUNTERS = ['van helsing', 'buffy', 'belmont', 'blade', 'winchester'];

export class BackgroundCheck extends Context.Service<
  BackgroundCheck,
  {
    readonly run: (
      applicantName: string,
    ) => Effect.Effect<BackgroundCheckReport, BackgroundCheckFlaked>;
  }
>()('spooky/BackgroundCheck') {
  static readonly layer = Layer.succeed(
    BackgroundCheck,
    BackgroundCheck.of({
      run: (applicantName) =>
        Effect.gen(function* () {
          const ms = yield* Random.nextIntBetween(200, 1200);
          yield* Effect.sleep(Duration.millis(ms));

          if ((yield* Random.next) < 0.4) {
            return yield* new BackgroundCheckFlaked({ applicantName });
          }

          const lower = applicantName.toLowerCase();
          const hunter = MONSTER_HUNTERS.find((name) => lower.includes(name));
          return hunter
            ? { applicantName, verdict: 'flagged', note: 'Known monster hunter.' }
            : { applicantName, verdict: 'clear', note: 'Nothing on file.' };
        }),
    }),
  );
}

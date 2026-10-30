// The Adoption Desk's backend acceptance criteria, as test titles. Rotation 1:
// turn each `it.todo` into a real `it.effect` test (see
// src/example/pumpkin-patch.test.ts for the shape) and make it pass.
//
// Never use BackgroundCheck.layer in a test: build a fake with Layer.succeed
// so the test decides when the check fails.
import { describe, it } from '@effect/vitest';

describe('Adoption application', () => {
  it.todo('a valid application adopts the monster: status, adoptedBy and adoptedAt are saved');
  it.todo('a blank or 1-character name fails with InvalidApplication naming the "name" field');
  it.todo('not accepting the haunting fails with InvalidApplication naming that field');
  it.todo('housing that does not suit the species fails with ApplicationRejected');
  it.todo('a vampire plus garlic fails with ApplicationRejected');
  it.todo('an unknown monster fails with MonsterNotFound');
  it.todo('an already-adopted monster fails with AlreadyAdopted, naming who adopted it');
});

describe('Background check', () => {
  it.todo('a check that flakes twice and then passes still adopts');
  it.todo('a check that never passes fails with BackgroundCheckUnavailable');
  it.todo('a check that hangs fails with BackgroundCheckUnavailable after 3 seconds (use TestClock)');
});

describe('The race', () => {
  it.todo('two simultaneous applications for the same monster: exactly one wins, the other gets AlreadyAdopted');
});

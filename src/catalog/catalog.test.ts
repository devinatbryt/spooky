// The Catalog's backend acceptance criteria, as test titles. Rotation 1:
// turn each `it.todo` into a real `it.effect` test (see
// src/example/pumpkin-patch.test.ts for the shape) and make it pass.
import { describe, it } from '@effect/vitest';

describe('Catalog search', () => {
  it.todo('with no filters, returns page 1 of every monster, 8 per page, plus the total count');
  it.todo('a name search is case-insensitive and matches part of a name ("snack" finds Count Snackula)');
  it.todo('species + status + page compose correctly');
  it.todo('a page past the end returns no monsters, not an error');
  it.todo('an unknown species or a page below 1 fails with InvalidSearch');
});

describe('Catalog detail', () => {
  it.todo('returns a monster by id');
  it.todo('an unknown id fails with MonsterNotFound');
});

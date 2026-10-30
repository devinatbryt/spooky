// The landing page's one read — provided infrastructure. A bare list of
// monsters so the Adoption Desk can reach /adopt/:monsterId before the
// Catalog exists on its branch. The Catalog does NOT build on this.
import { query } from '@solidjs/router';

import { MonsterRepo } from '../server/monster-repo';
import { runServer } from '../server/runtime';

export const getMonsterDirectory = query(async () => {
  'use server';
  return runServer(
    MonsterRepo.use((repo) => repo.list),
  ).then((monsters) => monsters.map(({ id, name, emoji, status }) => ({ id, name, emoji, status })));
}, 'monster-directory');

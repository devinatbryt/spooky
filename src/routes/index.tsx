import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { createMemo, For, Loading } from 'solid-js';

import { getMonsterDirectory } from '../lib/home';
import { adoptPath } from '../shared/monster';

// The landing page. Provided — neither pair needs to change it.

export const route = {
  preload: () => {
    void getMonsterDirectory();
  },
} satisfies RouteDefinition;

export default function Home() {
  return (
    <main class="mx-auto max-w-5xl space-y-10 p-6 pb-40">
      <Title>Monster Adoption Agency</Title>

      <header class="pt-6 text-center">
        <p class="text-6xl">🧛 🐺 👻 🧟 🧙 🏺</p>
        <h1 class="mt-4 font-display text-5xl tracking-wide text-accent">Monster Adoption Agency</h1>
        <p class="mx-auto mt-3 max-w-xl text-muted">
          Every monster deserves a dark, loving home. Two pairs, two slices, one agency. Read{' '}
          <code class="text-white">SPEC.md</code> before you touch anything.
        </p>
      </header>

      <section class="grid gap-4 sm:grid-cols-2">
        <a href="/monsters" class="rounded-xl border border-line bg-surface-2 p-6 transition hover:border-accent">
          <p class="text-sm font-medium tracking-wide text-accent uppercase">Keegan &amp; Grant</p>
          <h2 class="mt-1 text-2xl font-bold">The Catalog</h2>
          <p class="mt-2 text-muted">Browse, search and filter every monster. Lives at /monsters.</p>
        </a>
        <div class="rounded-xl border border-line bg-surface-2 p-6">
          <p class="text-sm font-medium tracking-wide text-accent uppercase">Devin &amp; Gabriel</p>
          <h2 class="mt-1 text-2xl font-bold">The Adoption Desk</h2>
          <p class="mt-2 text-muted">Apply to adopt one. Lives at /adopt/:monsterId.</p>
        </div>
      </section>

      <section>
        <h2 class="mb-1 text-lg font-semibold">Monster directory</h2>
        <p class="mb-4 text-sm text-muted">
          A plain list so the Desk can reach its route before the Catalog exists. Not part of either slice.
        </p>
        <Loading fallback={<div class="skeleton h-40" />}>
          <Directory />
        </Loading>
      </section>
    </main>
  );
}

function Directory() {
  const monsters = createMemo(() => getMonsterDirectory());
  return (
    <ul class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <For each={monsters()}>
        {(monster) => (
          <li>
            <a href={adoptPath(monster.id)} class="text-muted hover:text-accent">
              {monster.emoji} {monster.name}
              {monster.status === 'adopted' && <span class="ml-1 text-moon">(adopted)</span>}
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}

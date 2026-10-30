import { Title } from '@solidjs/meta';

// ===========================================================================
//  THE CATALOG STARTS HERE — Keegan & Grant.
//
//  Delete this placeholder. Read SPEC.md → "The Catalog" for what to build,
//  src/example/ for the Effect ↔ Solid shape, KOBALTE.md for components.
// ===========================================================================

export default function CatalogPage() {
  return (
    <main class="mx-auto max-w-5xl p-6 pb-40">
      <Title>Catalog · Monster Adoption Agency</Title>
      <section class="rounded-xl border border-dashed border-line p-10 text-center">
        <h1 class="mb-2 text-2xl font-semibold">The Catalog goes here.</h1>
        <p class="mx-auto max-w-md text-sm text-muted">
          24 monsters are waiting in <code class="text-white">MonsterRepo</code>. Start on the server: SPEC.md → The
          Catalog → Rotation 1.
        </p>
      </section>
    </main>
  );
}

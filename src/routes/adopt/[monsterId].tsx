import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';

// ===========================================================================
//  THE ADOPTION DESK STARTS HERE — Devin & Gabriel.
//
//  Delete this placeholder. Read SPEC.md → "The Adoption Desk" for what to
//  build, src/example/ for the Effect ↔ Solid shape, KOBALTE.md for components.
// ===========================================================================

export default function AdoptPage() {
  const params = useParams<{ monsterId: string }>();
  return (
    <main class="mx-auto max-w-3xl p-6 pb-40">
      <Title>Adopt · Monster Adoption Agency</Title>
      <section class="rounded-xl border border-dashed border-line p-10 text-center">
        <h1 class="mb-2 text-2xl font-semibold">The adoption form for “{params.monsterId}” goes here.</h1>
        <p class="mx-auto max-w-md text-sm text-muted">
          Start on the server: SPEC.md → The Adoption Desk → Rotation 1. The flaky{' '}
          <code class="text-white">BackgroundCheck</code> is waiting for you.
        </p>
      </section>
    </main>
  );
}

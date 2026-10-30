import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';

// THE CATALOG'S DETAIL PAGE — Keegan & Grant. Delete this placeholder.

export default function MonsterDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <main class="mx-auto max-w-3xl p-6 pb-40">
      <Title>Monster · Monster Adoption Agency</Title>
      <section class="rounded-xl border border-dashed border-line p-10 text-center">
        <h1 class="mb-2 text-2xl font-semibold">Monster detail for “{params.id}” goes here.</h1>
        <p class="text-sm text-muted">SPEC.md → The Catalog.</p>
      </section>
    </main>
  );
}

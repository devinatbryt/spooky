import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';

// The catch-all route. httpStatus() sets the response status during SSR; it
// runs in preload so the status is set before the response head flushes.
export const route = {
  preload: () => httpStatus(404),
} satisfies RouteDefinition;

export default function NotFound() {
  return (
    <main class="mx-auto max-w-xl p-10 text-center">
      <Title>Not found · Monster Adoption Agency</Title>
      <p class="text-6xl">🪦</p>
      <h1 class="mt-4 text-2xl font-semibold">Nothing lives here.</h1>
      <a href="/" class="mt-4 inline-block text-accent underline">Back to the agency</a>
    </main>
  );
}

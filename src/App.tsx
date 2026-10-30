import { Title } from '@solidjs/meta';
import { Toast } from '@kobalte/core/toast';
import { Errored, Loading } from 'solid-js';
import { Portal } from '@solidjs/web';

import ChaosPanel from './components/ChaosPanel';
import { Router } from './router';
import './App.css';

export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>Monster Adoption Agency</Title>

          <nav class="flex items-center gap-1 border-b border-line bg-surface-2/80 px-4 py-3 backdrop-blur">
            <a href="/" class="mr-2 rounded-lg px-3 py-1.5 font-semibold text-accent hover:bg-white/10">
              🎃 Monster Adoption Agency
            </a>
            <a href="/monsters" class="rounded-lg px-3 py-1.5 text-muted hover:bg-white/10 hover:text-white">
              Catalog
            </a>
            <a href="/example" class="rounded-lg px-3 py-1.5 text-muted hover:bg-white/10 hover:text-white">
              Worked example
            </a>
            <span class="ml-auto hidden text-xs text-muted sm:block">
              Solid 2 · Effect 4 · Kobalte
            </span>
          </nav>

          {/* <Errored> replaces 1.x <ErrorBoundary>; the fallback gets the
              error as an ACCESSOR plus a reset. This is the last line of
              defence — put your own boundaries closer to the data. */}
          <Errored
            fallback={(error, reset) => (
              <main class="mx-auto max-w-2xl p-8 text-center">
                <h1 class="mb-2 text-xl font-semibold text-blood">Something escaped the crypt</h1>
                <pre class="mb-4 overflow-x-auto rounded-lg border border-line bg-surface-2 p-4 text-left text-xs">
                  {String(error())}
                </pre>
                <button type="button" class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface" onClick={reset}>
                  Try again
                </button>
              </main>
            )}
          >
            {/* <Loading> replaces 1.x <Suspense>. */}
            <Loading fallback={<main class="p-8 text-center text-muted">Summoning…</main>}>
              {props.children}
            </Loading>
          </Errored>

          <Loading fallback={null}>
            <ChaosPanel />
          </Loading>

          {/* One toast region for the whole app. Show a toast from anywhere
              with `toaster.show(...)` — see KOBALTE.md. */}
          <Portal>
            <Toast.Region>
              <Toast.List class="fixed top-4 right-4 z-50 flex w-80 flex-col gap-2 outline-none" />
            </Toast.Region>
          </Portal>
        </>
      )}
    </Router>
  );
}

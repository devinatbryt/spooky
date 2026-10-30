// THE WORKED EXAMPLE PAGE — the browser half of src/example/.
//
// Shows, once each:
//   - a query read through createMemo, under its own <Loading>/<Errored>
//   - isPending for "updating" (as opposed to "first load")
//   - a <form> bound to a formAction, with aria-busy styling
//   - reading a typed failure off the latest submission and switching on _tag
//   - Kobalte TextField, RadioGroup and Button, styled with data-* variants
//   - a toast on every settled submission
//
// It runs on pumpkins on purpose. Copy the shape, not the code.
import { Button } from '@kobalte/core/button';
import { RadioGroup } from '@kobalte/core/radio-group';
import { TextField } from '@kobalte/core/text-field';
import { Title } from '@solidjs/meta';
import { useSubmissions, type RouteDefinition } from '@solidjs/router';
import { createMemo, Errored, For, isPending, Loading } from 'solid-js';

import { showToast } from '../components/toast';
import { getPumpkinStock, pickPumpkin, replantPatch } from '../example/api';
import { isTagged } from '../shared/errors';

export const route = {
  preload: () => {
    void getPumpkinStock();
  },
} satisfies RouteDefinition;

const SIZES = ['small', 'medium', 'giant'] as const;

export default function ExamplePage() {
  // Settled submissions only — the durable history of this action.
  const submissions = useSubmissions(pickPumpkin);
  const latest = () => submissions.at(-1);

  // The field-level failure, if the latest pick failed validation.
  const fieldError = (field: string) => {
    const error = latest()?.error;
    return isTagged(error, 'InvalidPick') && error.field === field ? error.message : undefined;
  };

  // Hooks run once per settled submission. Field errors render inline, so
  // everything else becomes a toast.
  const pick = pickPumpkin.onSettled((submission) => {
    const error = submission.error;
    if (error && !isTagged(error, 'InvalidPick')) {
      showToast({ title: 'No pumpkin for you', description: error.message, tone: 'error' });
    } else if (submission.result) {
      const { pickedBy, size, remaining } = submission.result;
      showToast({
        title: `${pickedBy} picked a ${size} pumpkin`,
        description: `${remaining} ${size} left in the patch.`,
        tone: 'success',
      });
    }
  });

  return (
    <main class="mx-auto max-w-3xl space-y-8 p-6 pb-40">
      <Title>Worked example · Monster Adoption Agency</Title>

      <header>
        <p class="text-sm font-medium tracking-wide text-accent uppercase">Worked example</p>
        <h1 class="mt-1 text-3xl font-bold">The Pumpkin Patch</h1>
        <p class="mt-2 text-muted">
          One Effect service, end to end. Read <code class="text-white">src/example/</code> first, then this page. Turn the
          Chaos Panel up to 1500ms and 30% before you trust what you see.
        </p>
      </header>

      <Errored
        fallback={(error, reset) => (
          <section class="rounded-xl border border-blood/60 bg-surface-2 p-6">
            <p class="font-semibold text-blood">Could not read the patch: {String(error())}</p>
            <button type="button" class="mt-3 text-sm text-accent underline" onClick={reset}>
              Retry
            </button>
          </section>
        )}
      >
        <Loading
          fallback={
            <div class="grid grid-cols-3 gap-3">
              <div class="skeleton h-28" />
              <div class="skeleton h-28" />
              <div class="skeleton h-28" />
            </div>
          }
        >
          <Stock />
        </Loading>
      </Errored>

      <form action={pick} method="post" class="group space-y-5 rounded-xl border border-line bg-surface-2 p-6">
        <h2 class="text-lg font-semibold">Pick a pumpkin</h2>

        <TextField name="pickedBy" validationState={fieldError('pickedBy') ? 'invalid' : 'valid'} class="flex flex-col gap-1.5">
          <TextField.Label class="text-sm font-medium">Your name</TextField.Label>
          <TextField.Input class="rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent data-invalid:border-blood" />
          {/* Dev console: Kobalte alpha.4 logs STRICT_READ_UNTRACKED here. It
              comes from inside Kobalte, not this line — see KOBALTE.md. */}
          <TextField.ErrorMessage class="text-sm text-blood">{fieldError('pickedBy')}</TextField.ErrorMessage>
        </TextField>

        <RadioGroup name="size" defaultValue="medium" class="flex flex-col gap-2">
          <RadioGroup.Label class="text-sm font-medium">Size</RadioGroup.Label>
          <div class="flex gap-2">
            <For each={SIZES}>
              {(size) => (
                <RadioGroup.Item value={size} class="group/item">
                  <RadioGroup.ItemInput class="peer" />
                  <RadioGroup.ItemLabel class="cursor-pointer rounded-lg border border-line px-4 py-2 capitalize group-data-checked/item:border-accent group-data-checked/item:bg-accent/15 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                    {size}
                  </RadioGroup.ItemLabel>
                </RadioGroup.Item>
              )}
            </For>
          </div>
        </RadioGroup>

        <div class="flex items-center gap-3">
          {/* `aria-busy` is set on the <form> by the router while the action
              is in flight — style it from CSS, no signal needed. */}
          <Button
            type="submit"
            class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface group-aria-busy:pointer-events-none group-aria-busy:opacity-60"
          >
            <span class="group-aria-busy:hidden">Pick it</span>
            <span class="hidden group-aria-busy:inline">Picking…</span>
          </Button>
          <Button
            type="button"
            class="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-white"
            onClick={() => void replantPatch()}
          >
            Replant the patch
          </Button>
        </div>
      </form>
    </main>
  );
}

function Stock() {
  const stock = createMemo(() => getPumpkinStock());

  return (
    // isPending is true while a CHANGE to the stock is in flight (a
    // revalidation after a pick), not on first load — that is <Loading>'s job.
    <section class={['grid grid-cols-3 gap-3', { 'is-pending': isPending(() => stock()) }]}>
      <For each={SIZES}>
        {(size) => (
          <article class="rounded-xl border border-line bg-surface-2 p-4 text-center">
            <p class="text-4xl">{size === 'giant' ? '🎃' : size === 'medium' ? '🟠' : '🔸'}</p>
            <p class="mt-2 text-sm text-muted capitalize">{size}</p>
            <p class="text-2xl font-bold tabular-nums">{stock()[size]}</p>
          </article>
        )}
      </For>
    </section>
  );
}

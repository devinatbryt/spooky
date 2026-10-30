// The Chaos Panel. Provided infrastructure — you should not need to touch it.
//
// Localhost is a liar: every server call resolves in about a millisecond, so
// <Loading> fallbacks never paint, pending states are invisible and error
// paths never run. Turn latency up and they all show. Turn failure up and
// every MonsterRepo write becomes a coin toss.
//
// It is also an example of a server read (getChaos) mirrored into local
// signals, so a control can move before the server has answered.
import { createEffect, createMemo, createSignal, createUniqueId, onSettled } from 'solid-js';

import { getChaos, updateChaos } from '../lib/chaos';

export default function ChaosPanel() {
  const chaos = createMemo(() => getChaos());

  // Local slider positions: a control bound to a 1500ms round trip is
  // unusable, so the slider moves now and the server value catches up.
  const [latency, setLatency] = createSignal(0);
  const [failure, setFailure] = createSignal(0);

  // Two-arg createEffect: the first function TRACKS, the second applies the
  // side effect. Whatever the second returns is treated as a cleanup, hence
  // the braces.
  createEffect(
    () => chaos(),
    (settings) => {
      setLatency(settings.latencyMs);
      setFailure(settings.failureRate);
    },
  );
  const [open, setOpen] = createSignal(true);

  return (
    <aside class="fixed right-4 bottom-4 z-40 w-72 rounded-xl border border-line bg-surface-2/95 text-sm shadow-2xl backdrop-blur">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 font-semibold tracking-tight"
        aria-expanded={open() ? 'true' : 'false'}
        onClick={() => setOpen((v) => !v)}
      >
        <span>🌩️ Chaos Panel</span>
        <span class="text-xs font-normal text-muted">
          {latency()}ms · {Math.round(failure() * 100)}%
        </span>
      </button>

      <div class={['space-y-5 px-4 pb-4', { hidden: !open() }]}>
        <ChaosSlider
          label="Latency (every repo call)"
          value={latency()}
          max={3000}
          step={100}
          format={(v) => `${v}ms`}
          fill="accent-accent"
          onInput={setLatency}
          onCommit={(latencyMs) => void updateChaos({ latencyMs })}
        />
        <ChaosSlider
          label="Write failure (repo saves)"
          value={failure()}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          fill="accent-blood"
          onInput={setFailure}
          onCommit={(failureRate) => void updateChaos({ failureRate })}
        />
        <p class="text-xs text-muted">
          Shared by every window. Resets when the server restarts.
        </p>
      </div>
    </aside>
  );
}

function ChaosSlider(props: {
  label: string;
  value: number;
  max: number;
  step: number;
  format: (value: number) => string;
  fill: string;
  onInput: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  const id = createUniqueId();

  // Each arrow-key press fires its own `change`, and separate requests can
  // land out of order — so commits are debounced: only the value the slider
  // settles on is sent.
  let pending: ReturnType<typeof setTimeout> | undefined;
  const commit = (value: number) => {
    clearTimeout(pending);
    pending = setTimeout(() => props.onCommit(value), 250);
  };
  onSettled(() => () => clearTimeout(pending));

  return (
    <div class="flex flex-col gap-2">
      <label for={id} class="flex justify-between text-muted">
        <span>{props.label}</span>
        <span class="text-white tabular-nums">{props.format(props.value)}</span>
      </label>
      {/* A native range input on purpose: Kobalte's Slider ignores keyboard
          and pointer input in 2.0.0-alpha.4 (see KOBALTE.md). `onInput` moves
          the local value; `onChange` fires on release (or per key press) and
          schedules the commit. */}
      <input
        id={id}
        type="range"
        min="0"
        max={props.max}
        step={props.step}
        value={props.value}
        class={['w-full', props.fill]}
        onInput={(event) => props.onInput(event.currentTarget.valueAsNumber)}
        onChange={(event) => commit(event.currentTarget.valueAsNumber)}
      />
    </div>
  );
}

// A tiny wrapper over Kobalte's toaster, so both slices show toasts the same
// way. Provided infrastructure. The <Toast.Region> lives in src/App.tsx.
//
//   showToast({ title: 'Adopted!', description: 'Count Snackula is yours.', tone: 'success' });
import { Toast, toaster } from '@kobalte/core/toast';

type Tone = 'info' | 'success' | 'error';

export function showToast(options: { title: string; description?: string; tone?: Tone }) {
  const tone = options.tone ?? 'info';
  return toaster.show((props) => (
    <Toast
      toastId={props.toastId}
      class={[
        'rounded-xl border bg-surface-2 p-4 shadow-2xl data-closed:opacity-0 data-swipe-end:translate-x-full',
        {
          'border-line': tone === 'info',
          'border-ghost/60': tone === 'success',
          'border-blood/70': tone === 'error',
        },
      ]}
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <Toast.Title class="font-semibold">{options.title}</Toast.Title>
          {options.description && (
            <Toast.Description class="mt-1 text-sm text-muted">{options.description}</Toast.Description>
          )}
        </div>
        <Toast.CloseButton class="text-muted hover:text-white" aria-label="Dismiss">
          ✕
        </Toast.CloseButton>
      </div>
    </Toast>
  ));
}

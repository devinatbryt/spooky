# DESIGN — class strings, so nobody bikesheds

Tokens live in `src/App.css` (`@theme`). Everything below is a Tailwind
utility string you can paste. Spend the session on behaviour, not padding.

## Tokens

| Token | Use |
|---|---|
| `surface`, `surface-2`, `surface-3` | page, cards, raised controls |
| `line` | borders, dividers |
| `muted` | secondary text |
| `accent` (pumpkin) | primary actions, focus, the selected thing |
| `ghost` (ectoplasm green) | success, "available" |
| `blood` | errors, rejections, destructive |
| `moon` | "adopted", secondary info |
| `font-display` | the one spooky headline per page, no more |

## Layout

- Page: `mx-auto max-w-5xl space-y-8 p-6 pb-40` (the `pb-40` clears the Chaos Panel)
- Page header: `text-sm font-medium tracking-wide text-accent uppercase` (eyebrow) +
  `mt-1 text-3xl font-bold` (title) + `mt-2 text-muted` (lede)
- Card grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
- Toolbar (filters): `flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-2 p-4`

## Monster card

- Card: `rounded-xl border border-line bg-surface-2 p-4 transition hover:border-accent`
- Emoji: `text-5xl`
- Name: `mt-3 font-semibold`
- Meta line: `text-sm text-muted` ("Vampire · 412 yrs")
- Badge, available: `rounded-full bg-ghost/15 px-2 py-0.5 text-xs font-medium text-ghost`
- Badge, adopted: `rounded-full bg-moon/15 px-2 py-0.5 text-xs font-medium text-moon`

## Controls

- Primary button: `rounded-lg bg-accent px-4 py-2 font-semibold text-surface hover:brightness-110 disabled:opacity-50`
- Secondary button: `rounded-lg border border-line px-4 py-2 text-muted hover:text-white`
- Danger button: `rounded-lg bg-blood px-4 py-2 font-semibold text-white`
- Text input: `rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent data-invalid:border-blood`
- Field label: `text-sm font-medium`
- Field error: `text-sm text-blood`
- Select trigger: `flex min-w-44 items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2`
- Popover/listbox: `rounded-lg border border-line bg-surface-2 p-1 shadow-2xl`
- Listbox option: `cursor-pointer rounded-md px-3 py-1.5 outline-none data-highlighted:bg-accent/20 data-selected:text-accent`
- Tab list: `flex gap-1 rounded-lg bg-surface p-1`
- Tab: `rounded-md px-3 py-1.5 text-sm text-muted data-selected:bg-surface-3 data-selected:text-white`
- Pager item: `size-9 rounded-lg border border-line text-sm aria-[current=page]:border-accent aria-[current=page]:text-accent`
- Checkbox box: `grid size-5 place-items-center rounded border border-line data-checked:border-accent data-checked:bg-accent text-surface`
- Dialog overlay: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`
- Dialog panel: `fixed top-1/2 left-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-surface-2 p-6 shadow-2xl`

## States (pre-built in App.css)

Use the `class` array/object form; `classList` is gone in Solid 2:

```tsx
<section class={["grid gap-4", { "is-pending": isPending(() => results()) }]} />
```

- `is-pending`: something on screen is being replaced (pulses)
- `is-stale`: readable but visibly not fresh (dimmed)
- `is-rejected`: the server said no (shakes once, red outline)
- `skeleton h-40`: loading placeholder block (give it a height)
- Empty state: `rounded-xl border border-dashed border-line p-10 text-center text-muted`
- Inline error panel: `rounded-xl border border-blood/60 bg-surface-2 p-6`

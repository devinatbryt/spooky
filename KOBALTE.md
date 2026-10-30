# Kobalte — what you need for this repo

Installed: **`@kobalte/core@2.0.0-alpha.4`**, the first Solid 2 build. Its
peer is exactly `solid-js@2.0.0-rc.16`, which is why the whole Solid
toolchain is pinned there. Kobalte is **headless**: it gives you behaviour,
focus management and ARIA, and you bring every class.

Docs: https://kobalte.dev. They're written for 0.13 / Solid 1, but the
component anatomy is the same.

---

## Imports: per component, always

```ts
import { Select } from "@kobalte/core/select";        // ✅
import { Select } from "@kobalte/core";               // ❌ throws ERR_PACKAGE_PATH_NOT_EXPORTED
```

## Styling: Tailwind v4 `data-*` variants, no plugin

Kobalte sets state as data attributes, and Tailwind v4 matches them
directly. `@kobalte/tailwindcss` is for Tailwind 3; don't install it.

| State | Attribute | Tailwind |
|---|---|---|
| open (Select, Dialog, Popover) | `data-expanded` | `data-expanded:rotate-180` |
| keyboard/pointer highlight in a list | `data-highlighted` | `data-highlighted:bg-accent/20` |
| selected tab / option | `data-selected` | `data-selected:text-accent` |
| checked (Checkbox, RadioGroup item) | `data-checked` | `data-checked:bg-accent` |
| invalid (form controls) | `data-invalid` | `data-invalid:border-blood` |
| disabled | `data-disabled` | `data-disabled:opacity-50` |

Style a *child* from a parent's state with a named group:
`<RadioGroup.Item class="group/item">` and then `group-data-checked/item:…`
on the label. `src/routes/example.tsx` does this.

When unsure what a part carries, inspect it in devtools. The attribute list
is right there.

---

## The parts you'll use

Anatomy only. Wiring them to your data is the exercise.

**Both slices:** `Button` (`@kobalte/core/button`). `TextField`:
`TextField` › `.Label`, `.Input`, `.Description`, `.ErrorMessage`. Set
`validationState="invalid"` on the root to show `.ErrorMessage`. Give the root
a `name` and it posts with a `<form>` like a native input.

**The Catalog:**
- **Select**: `Select` (`options`, `value`, `onChange`, `itemComponent`) ›
  `.Trigger` › `.Value`, `.Icon`; `.Portal` › `.Content` › `.Listbox`. Each
  option renders through `itemComponent={(p) => <Select.Item item={p.item}>…</Select.Item>}`
  with `.ItemLabel` / `.ItemIndicator`. Options can be plain strings or
  objects (then pass `optionValue` / `optionTextValue`). For a nullable
  "All" choice, decide whether "All" is an option or `null`.
- **Tabs**: `Tabs` (`value`, `onChange`) › `.List` › `.Trigger value="…"`,
  plus an optional `.Indicator`. You don't need `.Content` if the tabs only
  filter one shared grid.
- **Pagination**: `Pagination` (`count`, `page`, `onPageChange`,
  `itemComponent`, `ellipsisComponent`) › `.Previous`, `.Items`, `.Next`.
  `itemComponent={(p) => <Pagination.Item page={p.page}>{p.page}</Pagination.Item>}`.
  **Gotcha:** the root renders `<nav><ul>…</ul></nav>`, and you can't put a
  class on the `<ul>`, so items stack vertically. Style it from the root with
  `[&>ul]:flex [&>ul]:items-center [&>ul]:gap-1`. The current item gets
  `aria-current="page"` and `data-current`; Previous/Next get `disabled` and
  `data-disabled` at the ends.

**The Adoption Desk:**
- **RadioGroup**: `RadioGroup` (`name`, `value`/`defaultValue`) › `.Label`,
  then per option `.Item value="…"` › `.ItemInput`, `.ItemControl` ›
  `.ItemIndicator`, `.ItemLabel`. See `/example`.
- **Checkbox**: `Checkbox` (`name`, `checked`/`defaultChecked`, `onChange`)
  › `.Input`, `.Control` › `.Indicator`, `.Label`, `.ErrorMessage`. A checked
  box posts `name=on`; an unchecked one posts **nothing** (standard HTML).
- **Dialog**: `Dialog` (`open`, `onOpenChange`) › `.Trigger`; `.Portal` ›
  `.Overlay`, `.Content` › `.Title`, `.Description`, `.CloseButton`.
  **Gotchas:** `.Portal` renders at the end of `<body>`, *outside* your
  `<form>`, so a submit button inside the dialog needs `form="your-form-id"`
  to submit that form. And pressing **Enter** in a text field submits the
  form directly, skipping your confirm dialog, unless you intercept the
  form's submit.

**Toasts**: already mounted in `src/App.tsx`. Call
`showToast({ title, description?, tone? })` from `src/components/toast.tsx`.

---

## Known issues in alpha.4 (not your bug)

Checked in a real browser on this repo, both after a hard page load and
after client-side navigation:

| Component | Status |
|---|---|
| Select, Tabs, Pagination, Checkbox, Dialog, TextField, RadioGroup, Button, Toast | ✅ work |
| **Slider** | ❌ ignores keyboard and pointer input. Don't use it (the Chaos Panel uses native range inputs for this reason). |

Dev-console noise that comes from **inside Kobalte**, so don't chase it.
Several of these name *your* line in the stack, because Kobalte reads the
prop you passed:

- `[STRICT_READ_UNTRACKED] … in <TextField.ErrorMessage>` (also other
  `.ErrorMessage` parts). The component reads `validationState` in its own
  body. The message still shows and updates correctly.
- `[STRICT_READ_UNTRACKED]` on a **controlled** `TextField`'s `value`.
  Kobalte reads it once in its body; the input still follows your signal.
- `[EFFECT_RELAY_TEAR]` from `<TextField.Input> › <Polymorphic>`, **Tabs**,
  **Select**, **Dialog** and `Checkbox.Indicator`.
- `[EFFECT_WRITES_OWN_SOURCE]` from **Select**, **Dialog** and
  `Checkbox.Indicator`.

If the diagnostic is about a signal, memo or effect **you** created, it's
yours.

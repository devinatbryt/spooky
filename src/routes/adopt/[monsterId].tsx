import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { RadioGroup } from '@kobalte/core/radio-group';
import { Checkbox } from '@kobalte/core/checkbox';
import { TextField } from '@kobalte/core/text-field';
import { Button } from '@kobalte/core/button';
import { Dialog } from '@kobalte/core/dialog';
import { For } from 'solid-js';
import { HOUSING_LABELS } from '../../shared/monster';
import { Record as Rec } from 'effect';

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
      <section class="p-10">
        <form method="post" class="group space-y-5 rounded-xl border border-line bg-surface-2 p-6">
          <TextField required name="pickedBy" class="flex flex-col gap-1.5">
            <TextField.Label class="text-sm font-medium">Your name</TextField.Label>
            <TextField.Input class="rounded-lg border border-line bg-surface px-3 py-2 outline-none focus:border-accent data-invalid:border-blood" />
            {/* <TextField.ErrorMessage class="text-sm text-blood">{fieldError('pickedBy')}</TextField.ErrorMessage> */}
          </TextField>
          <RadioGroup name="housing" required class="flex flex-col gap-4">
            <RadioGroup.Label class="text-sm font-medium">Size</RadioGroup.Label>
            <div class="flex gap-2">
              <For each={Rec.keys(HOUSING_LABELS)}>
                {(value) => (
                  <RadioGroup.Item value={value} class="group/item">
                    <RadioGroup.ItemInput class="peer" />
                    <RadioGroup.ItemLabel class="cursor-pointer rounded-lg border border-line px-4 py-2 capitalize group-data-checked/item:border-accent group-data-checked/item:bg-accent/15 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                      {HOUSING_LABELS[value]}
                    </RadioGroup.ItemLabel>
                  </RadioGroup.Item>
                )}
              </For>
            </div>
          </RadioGroup>
          <div class="flex gap-8 my-8">
            <Checkbox name="keeps_garlic" required={false} class="flex items-center gap-2">
              <Checkbox.Input />

              <Checkbox.Control class="grid size-5 place-items-center rounded border border-line data-checked:border-accent data-checked:bg-accent text-surface">
                <Checkbox.Indicator>
                  <svg class="fill-white w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="text-sm font-medium">
                Keeps garlic?
              </Checkbox.Label>
            </Checkbox>
            <Checkbox name="accepts_being_haunted" required class="flex items-center gap-2">
              <Checkbox.Input />

              <Checkbox.Control class="grid size-5 place-items-center rounded border border-line data-checked:border-accent data-checked:bg-accent text-surface">
                <Checkbox.Indicator>
                  <svg class="fill-white w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="text-sm font-medium">
                You may be haunted, do you accept?
              </Checkbox.Label>
            </Checkbox>
          </div>
          <Button
            type="submit"
            class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface group-aria-busy:pointer-events-none group-aria-busy:opacity-60 hover:brightness-110 disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            <span class="group-aria-busy:hidden">Adopt</span>
            <span class="hidden group-aria-busy:inline">Adopting...</span>
          </Button>
        </form>
      </section>
    </main>
  );
}

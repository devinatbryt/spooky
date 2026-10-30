// The Adoption Desk's slot in the app runtime (src/server/runtime.ts imports it).
//
// When you write your Desk service, register its layer here, e.g.
//
//   export const AdoptionLayer = AdoptionDesk.layer;
//
// or several at once with Layer.mergeAll(...). Anything your layer needs from
// shared infrastructure (MonsterRepo, BackgroundCheck, Chaos) is provided for
// you by the runtime — you do not provide it here.
//
// Only the Adoption Desk pair edits this file.
import { Layer, Context, Effect, Schema, SchemaIssue } from 'effect';
import { MonsterRepo } from '../server/monster-repo';
import { BackgroundCheck } from '../server/background-check';
import { Chaos } from '../server/chaos';
import { Housing, type Monster } from '../shared/monster';
import { ChaosRejected, MonsterNotFound } from '../shared/errors';

const ApplyRequest = Schema.fromFormData(
    Schema.toCodecStringTree(
        Schema.Struct({
            monster_id: Schema.String,
            housing: Housing,
            name: Schema.Trim.pipe(
                Schema.check(
                    Schema.isMinLength(2, { message: 'Tell us who you are (2+ characters).' }),
                    Schema.isMaxLength(40, { message: 'Keep it under 40 characters.' })
                )
            ),
            keeps_garlic: Schema.Boolean.pipe(
                Schema.withDecodingDefault(Effect.succeed(false)),
                Schema.withConstructorDefault(Effect.succeed(false))
            ),
            accepts_being_haunted: Schema.Boolean.pipe(
                Schema.withDecodingDefaultTypeKey(Effect.succeed(false)),
                Schema.check(Schema.makeFilter((b: boolean) => b || 'You must accept being haunted'))
            )
        })
    )
)

/** Bad input. `field` names the form field so the UI can put the message next to it. */
export class InvalidApplication extends Schema.TaggedError<InvalidApplication>()('InvalidApplication', {
    field: Schema.String,
    reason: Schema.String,
}) {
    override get message() {
        return this.reason;
    }
}

export class AlreadyAdopted extends Schema.TaggedError<AlreadyAdopted>()('AlreadyAdopted', {
    adoptedBy: Schema.String,
}) {
    override get message() {
        return `Already adopted by ${this.adoptedBy}`;
    }
}

export class ApplicationRejected extends Schema.TaggedError<ApplicationRejected>()('ApplicationRejected', {
    reason: Schema.String,
}) {
    override get message() {
        return this.reason;
    }
}

export const AdoptionLayer = Layer.mergeAll(MonsterRepo.layer, BackgroundCheck.layer, Chaos.layer);

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1()

export class AdoptionDesk extends Context.Service<
    AdoptionDesk,
    {
        apply: (formData: FormData) => Effect.Effect<Monster, InvalidApplication | ApplicationRejected | MonsterNotFound | ChaosRejected>
    }
>()('spooky/adoption/AdoptionDesk') {
    static readonly layer = Layer.effect(
        AdoptionDesk,
        Effect.gen(function* () {
            const monsterRepo = yield* MonsterRepo
            const chaos = yield* Chaos
            const backgroundCheck = yield* BackgroundCheck
            return AdoptionDesk.of({
                apply: (formData) => Effect.gen(function* () {
                    const input = yield* Schema.decodeEffect(ApplyRequest)(formData).pipe(
                        Effect.mapError((e) => {
                            const [first] = formatIssues(e.issue).issues
                            const field = first?.path?.[0]
                            return new InvalidApplication({
                                field: typeof field === 'object' ? String(field.key) : String(field ?? "form"),
                                reason: first?.message ?? 'Application is invalid'
                            })
                        })
                    );
                    const monster = yield* monsterRepo.get(input.monster_id);

                    if (monster.species === 'vampire' && ['house-with-yard', 'apartment'].includes(input.housing)) {
                        return yield* Effect.fail(
                            new ApplicationRejected({
                                reason: 'Vampire can only live in a crypt or haunted mansion.'
                            })
                        )
                    }
                    if (monster.species === 'vampire' && input.keeps_garlic) {
                        return yield* Effect.fail(
                            new ApplicationRejected({
                                reason: 'Vampires cannot live with garlic.'
                            })
                        )
                    }
                    if (monster.species === 'werewolf' && input.housing !== 'house-with-yard') {
                        return yield* Effect.fail(
                            new ApplicationRejected({
                                reason: 'Werewolves cannot live in a house without a yard.'
                            })
                        )
                    }
                    if (monster.species === 'zombie' && input.housing !== 'apartment') {
                        return yield* Effect.fail(
                            new ApplicationRejected({
                                reason: 'Zombies cannot live in an apartment.'
                            })
                        )
                    }
                    if (monster.species === 'mummy' && input.housing !== 'crypt') {
                        return yield* Effect.fail(
                            new ApplicationRejected({
                                reason: 'Mummies can only live in a crypt'
                            })
                        )
                    }

                    const saved_monster = yield* monsterRepo.save({
                        ...monster,
                        status: 'adopted',
                        adoptedBy: input.name,
                        adoptedAt: Date.now()
                    })

                    return saved_monster
                })
            });
        }).pipe(Effect.provide(AdoptionLayer)),
    );
}

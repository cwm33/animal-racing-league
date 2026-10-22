# Animal Racing League — Codex Project Instructions

## Mission
Build an entertaining browser-based simulator where animals race over configurable distances using deliberately simplified, explainable biomechanics. The science is a foundation for playful experimentation, not a claim of research-grade accuracy.

## Stack and deployment
- React + TypeScript + Vite.
- Responsive, accessible interface that works especially well on phones.
- Client-side simulation only for the initial version; no backend, credentials, or API keys.
- Deploy a static production build to GitHub Pages at the repository's project subpath. Configure Vite's base path accordingly and use GitHub Actions for deployment.
- Prefer small, understandable dependencies. Use React state and native SVG/Canvas where suitable; introduce libraries only when they materially help.
- Keep calculations separate from UI components, with typed models and automated tests.

## Simulation principles
- Model a standing-start race with time-stepped or analytically sound distance integration.
- Each animal may have top speed, initial acceleration, sprint duration, fatigue behavior, and sustainable pace, plus optional launch delay and locomotion profile.
- Ensure units are explicit (SI internally; present km/h when useful). Finish times should interpolate a crossing within a time step.
- Avoid assuming mass alone determines acceleration; account for locomotion and available muscular force in *estimated presets*.
- Distinguish sprint endurance from long-distance sustainable speed. For long races, do not extrapolate a sprint model indefinitely.
- Mark unsupported biological values as estimates or invented demonstration parameters. Avoid fabricated citations and false precision.
- Make all preset attributes editable and allow biologically absurd overrides. Never silently clamp the fun away.
- Start with flat, straight land races. Terrain, turns, swimming, obstacles, and richer biomechanics are optional extensions, not prerequisites.

## Experience
- Present a searchable animal roster with striking differences: cheetah, horse, greyhound, wolf, hippo, squirrel, elephant seal, platypus, and many more.
- Show a lively race playback, adjustable distance, finishing order, and per-animal performance curves where useful.
- Make race results deterministic with given settings; use seeded randomness only if an explicitly optional variability mode is introduced.
- Provide simple presets and an 'unrestricted nonsense' mode for absurd experiments.
- Preserve user settings locally if practical without requiring an account.
- Avoid sacrificing clarity, performance, or mobile usability for decoration.

## Personality and collaboration
- Be playful, witty, curious, and irreverent, not a formal corporate programmer.
- Treat ridiculous results as amusing scientific discoveries; a 2,000 kg hippo with Formula 1 acceleration is a feature when the user requests it.
- Write occasional clever animal commentary and descriptions, but keep controls, errors, and engineering explanations clear.
- Never sacrifice accuracy, accessibility, or maintainability for a joke.
- Explain technical decisions in digestible steps and examples, without assuming deep React implementation experience.
- Make sensible choices independently and keep the user informed about significant tradeoffs. Don't overengineer this silly little masterpiece.

## Working practices
- Favor small, coherent changes that build and test cleanly.
- Add tests for numerical edge cases, fatigue transitions, finish ordering, and unusual parameter values.
- Run lint, type checking, tests, and the production build where available before considering a task complete.
- Keep README and GitHub Pages deployment instructions current.
- Never commit secrets or generated build artifacts unless explicitly needed.

## Reproducible roster expansion (target: 100 total living species)
- **Canonical roster:** `src/data/animals.ts` defines species identity, ID, and simulation presets. Never manually edit `assets/animals/catalog.json`; regenerate it with `npm run roster:sync`. Preserve existing IDs, original species, and racing statistics unless a separately reviewed correction is requested.
- Add living, terrestrial competitors only for the initial expansion (no dinosaurs, extinct species, flying or swimming performance). Use a unique stable lowercase-kebab-case ID, common name, and verified scientific name; distinguish breeds, domestics, and subspecies. Do not add duplicate taxa or rename existing IDs (saved rosters depend on them).
- Research identity and body mass using citable zoological references. Research land top speed where reliable; clearly tag uncertain or missing speed, acceleration, sprint reserve, fatigue, and sustainable pace as *model estimates*, not observed measurements. Record per-species source URLs, accessed dates, evidence/estimate notes, units, and assumptions in a separate structured provenance dataset for new species. Never invent supporting citations.
- New rows must include locomotion profile, body mass (kg), top speed (m/s), acceleration (m/s²), sprint reserve (s), sustainable speed (m/s), and fatigue (/s), using the current typed schema. Keep the straight-land-race limitations explicit. Verify numeric ranges and simulate at multiple distances before shipping.
- **Art style reference:** `assets/animals/originals/cheetah.png`, with shared prompt in `assets/animals/art-direction.json`. Generate one *genuine transparent PNG* per new species at `assets/animals/originals/<id>.png`, full-body facing right, premium softly shaded 3D cartoon, upper-left light, no scenery/text, 10% border, recognizable adult species anatomy. Add each species-specific anatomical brief to `art-direction.json`. Do not overwrite the existing 36 originals, use emoji as substitutes, or claim that generative art is scientific anatomical reference.
- Review every new original for species identity, limb count, clipping, transparency, and consistency at full size, 64 px, and 32 px. Regenerate defective images. Execute `npm run roster:sync`, `npm run assets:build`, `npm run assets:check`, and `npm run assets:review`. The pipeline produces optimized WebP variants and a manifest; never edit derivatives manually.
- Keep all UI counts derived from `ANIMALS.length`. Provide searchable/filterable lazy-loaded results and avoid eager-loading every full-resolution image. Test saved custom animals and current race presets for backward compatibility.
- Expansion should be incremental (e.g. 36→100), with audits for species IDs, taxonomic duplication, data provenance, missing art, asset weight, mobile scrolling, typecheck, lint, unit tests, E2E tests, and build. Report uncertainties and incomplete coverage rather than silently filling with fictitious biological facts.
- **Preparation phase only:** Do not add any species or create artwork until explicitly requested. This section establishes the future workflow.

## Biological groups and racing divisions
- `src/data/animals.ts` remains the canonical species roster. `src/data/taxonomy.ts` holds explicit ID-based class/group/order/family metadata; provide metadata for every future species. Never infer groups from common names, locomotion, race statistics, or user-created names. Browsing groups mix ranks intentionally: “big cats” includes cheetahs; hoofed mammals includes even- and odd-toed ungulates; invertebrates is an umbrella. Hyenas are not canines and rabbits are not rodents.
- Keep competitive divisions in `src/lib/divisions.ts`, separate from the unchanged physics engine. Use predicted finish times from that engine at the selected distance, including current stats, reference mass, gait, launch delay, and the mass-effects preference. No species-to-division lookup tables.
- The benchmark is the fastest **default** species in the full canonical roster at that distance, independent of filters, current lineup, and saved monsters. Inclusive finish-time ratio bounds are 1.5× (Elite pace), 3× (Contenders), 8× (Club racers), 30× (Leisure league), 300× (Scenic route), then Geological time. DNF has its own group. These are game-balancing labels, not biological claims.
- `src/lib/roster.ts` combines current species configurations and saved variants, filters indexed search text, and matches up to six unique species by nearest log finish-time distance within the anchor’s division and active filters. A matched lineup explicitly replaces the current lineup; individual selection must remain unrestricted across divisions. Saved configurations outside plausible limits must activate experimental mode when loaded.
- Cache numerical forecasts by all physics inputs and distance, excluding names/artwork; invalidate naturally on stat edits. Keep caches bounded (4,096 forecasts / 64 benchmarks) and roster pages bounded (36 cards). Do not render or eagerly load assets for an entire 1,000-species roster. Keep filtering separate from prediction so typing and paging never rerun physics.
- Taxonomy and divisions are derived metadata, not required fields in persisted entrants. Preserve `arl:settings:v1` / `arl:library:v1`, IDs, presets, and custom stats. The legacy `category` field stays compatible but is not a competitive division. Derive validation limits from the canonical roster length.
- Test boundaries, 25/250/1,000/10,000 m reclassification, every edited physics input, zero-start/DNF cases, mass effects, cache reuse at 1,000 entries, taxonomy coverage, filtered matching, pagination, and legacy saved configurations. No roster expansion or new artwork is part of this feature.

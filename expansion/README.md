# Menagerie expansion: 36 → 100

This is a separate integration pack on `feature/menagerie-assets`. It adds **exactly 64 living species**, including **quokka (*Setonix brachyurus*)**, with no ID or taxon collision against the original 36. All changed repository files are under `expansion/`. The application roster, catalogs, 36 original illustrations, production assets, scripts, and tests are unchanged.

| Biological group | New competitors |
| --- | ---: |
| Mammals | 22 |
| Birds | 12 |
| Reptiles | 10 |
| Amphibians | 6 |
| Terrestrial invertebrates | 14 |
| **Total** | **64** |

The additions also represent 64 different genera. Cassowary, emu, secretary bird, greater roadrunner, pangolin, wombat, Komodo dragon, tarantula, emperor scorpion, and coconut crab are included. No new domestic breeds, extinct taxa, or primarily aquatic adults are included. Birds race on foot; amphibians represent terrestrial adults; coconut-crab marine larvae are excluded. Arboreal species represent only their terrestrial movement.

## Completeness and limitations

- **Data:** 64 complete records, all seven required racing fields, current application category/source/locomotion values, biological groups, taxonomy, adult life stage, source links, access dates, evidence notes, and explicit assumptions.
- **Research:** 56 entries have quantitative mass evidence in consulted accounts, zoo material, or studies. Eight masses remain estimates: Gila monster, common toad, six-spotted tiger beetle, Saharan silver ant, European mantis, giant desert centipede, Solórzano's velvet worm, and common rough woodlouse. Their references establish identity or biological context, not those mass values.
- **Speed:** nine entries have quantitative speed context. These include reported maxima, conflicting summaries, and a travel-speed observation that is explicitly **not** treated as a top speed. The Saharan silver ant has a primary video-measured maximum of 0.855 m/s; its simulation preset is rounded down to 0.8 m/s. Other top-speed presets remain estimates unless their evidence record says otherwise. This is a scoped research pass, not an exhaustive literature review.
- **Artwork:** 64 individually generated, decodable RGBA PNGs with genuinely transparent backgrounds, one per ID, using the original cheetah as the style reference. No emoji, photographs, stock art, copied existing species, or procedural animal placeholders were substituted. Originals are retained as delivered by the generator, except that selected images were replaced by reviewed image-generation retries. No original application artwork was changed.
- **Art-direction exceptions:** the generator left low-opacity stray alpha outside the visible silhouettes. All 64 originals fail the literal requirement of a completely clear 10% border. Most visible silhouettes are also larger than the requested central 80%; none visibly touches a canvas edge at alpha ≥ 16/255. The quokka framing retry improves visible padding. These are **known exceptions, not a claim of perfect framing compliance**. See the current per-image values in [image-checks.json](review/image-checks.json). Integration needs padding/alpha cleanup through the normal asset pipeline or further reviewed regeneration before strict art acceptance.
- **Anatomy:** all originals were visually reviewed in native-size contact sheets and at 64 px and 32 px. Species silhouettes and major appendages were checked. Small toes, occluded limbs, and exact multi-legged segment counts cannot be certified from stylized art. Per-image review notes and regeneration history are in [artwork-review.json](review/artwork-review.json). The velvet worm was regenerated after the first version had too few legs. Illustrations are not scientific anatomical reference plates.

This pack is complete in record and PNG coverage. **Strict art-direction acceptance remains conditional** on the documented framing and fine-anatomy review issues.

## Contents

| File | Purpose |
| --- | --- |
| [species.json](species.json) | Flat array of 64 `Animal`-compatible records plus integration metadata |
| [sources.json](sources.json) | Per-species, per-field SI values, evidence types, source URLs, access dates, model rules, and limitations |
| [art-direction.json](art-direction.json) | Existing shared style, unchanged cheetah-reference hash, species anatomical briefs, generation notes |
| `originals/{id}.png` | 64 source PNG illustrations, excluded from the current application |
| [review/index.html](review/index.html) | Local, dependency-free artwork viewer with checker, white, and dark backgrounds |
| `review/full-size-{01..08}.webp` | Eight contact sheets retaining original pixel dimensions at 1:1 scale; contact-sheet compression is lossy, source PNGs are unchanged |
| [review/contact-64px.png](review/contact-64px.png), [review/contact-32px.png](review/contact-32px.png) | Exact-size sprite review sheets, scaled directly from original canvases |
| [review/image-checks.json](review/image-checks.json) | Original SHA-256, bytes, dimensions, alpha statistics, visible bounds, strict framing exceptions |
| [review/simulation-checks.json](review/simulation-checks.json) | 600 races through the actual unchanged simulation engine |
| [research.json](research.json) | Initial ADW retrieval audit, including failed routes and classification-only pages; these are not all supporting citations |
| `prepare.py`, `generate.py`, `validate.py`, `validate-simulation.mjs`, `typecheck.ts` | Pack-local research seed, deterministic compilation, validation, review, and schema checks |

## Evidence and modelling

`stats` uses the exact `RacingStats` keys from `src/lib/types.ts`:

| Key | SI unit | Interpretation |
| --- | --- | --- |
| `mass` | kg | Rounded representative adult model mass |
| `topSpeed` | m/s | Effective straight-land sprint preset |
| `acceleration` | m/s² | Constant nominal launch acceleration, before gait coefficient |
| `sprint` | s | Reserve **after attaining top speed**, not total burst duration |
| `sustainable` | m/s | Low mathematical tail, not demonstrated indefinite endurance |
| `fatigue` | 1/s | Exponential decay coefficient, before gait coefficient |
| `delay` | s | Zero standing-start convention |

Every numerical `stats` value remains a simulation preset. In `sources.json`, `primary_measurement` identifies a study observation, `reported_summary` identifies a species account or zoo summary, and `model_estimate` identifies unsupported model parameters. Source evidence retains its own value and scope, separately from the chosen preset. A range, sample mean, sex-specific example, and maximum are not interchangeable. Older or questionable claims are annotated, including the unsupported 40 km/h wombat story, conflicting wolverine speeds, historical armadillo/red-panda species limits, and rosy-boa complex mass context.

Acceleration, sprint reserve, sustainable speed, fatigue and delay are all explicitly estimated. `modelRules` records the conservative group-based launch time, short reserve, low sustainable fraction, and fatigue choice. These rules are **not** inferred from body mass or presented as fitted biology. The application's existing gait coefficients multiply launch and fatigue again. `bound` approximates hopping with a continuous speed curve; `crawl` is the nearest existing profile for snakes, worms, slugs and many-legged animals. These coefficients do not reproduce those animals' detailed biomechanics. Long-distance finishes, especially for ectotherms and tiny invertebrates, are mathematical extrapolations that omit rest, thermoregulation, moisture, food, sleep and motivation.

## Integrating in a separate change

1. Review the limitations and artwork notes. Keep this pack's IDs stable. Its baseline SHA-256 in `sources.json` identifies the 36-entry `src/data/animals.ts` used for duplicate checks; rerun collision checks if the target branch has changed.
2. Append the 64 records' existing `Animal` fields to the canonical application data. Use **only** `id`, `name`, `scientific`, `emoji`, `color`, `category`, `locomotion`, `description`, `biology`, `source`, and `stats`. They can be mapped to the existing tuple loader or imported as typed records in the integration PR. Preserve the original rows, IDs and stats.
3. Keep `biologicalGroup`, `taxonomy`, `lifeStage`, `raceMedium`, `provenanceId`, and `artwork` as sidecar metadata keyed by ID, or deliberately extend the app types in that later change. `order: null` for the velvet worm avoids forcing an uncertain order rank. Do not conflate the five biological groups with the four existing racing categories.
4. `source: 'adw'` is retained solely because the current `Animal.source` union permits only `adw | cheetah | human`. It is a **legacy general-context link**, not a claim that ADW verifies every new species or number. Integrate an ID-based provenance resolver from this pack before presenting per-field evidence. `emoji` is intentionally an empty string; generated art supplies the visual, with no emoji placeholder.
5. Copy only the 64 new PNGs to `assets/animals/originals/{id}.png` and merge their species briefs into the existing art direction. Preserve all original 36 files and reference hashes. Resolve the documented framing/alpha issues; the existing derivative builder normalizes visible bounds and padding but does not certify anatomical correctness or erase all alpha noise in the source PNGs.
6. In the **integration PR**, run `npm run roster:sync`, `npm run assets:build`, `npm run assets:check`, and `npm run assets:review`, then check a combined 100-entry roster and responsive asset coverage. These write outside `expansion/` and were deliberately not run here. Do not hand-edit shared catalogs or WebP derivatives.
7. Verify derived UI counts, search/filter behaviour, lazy loading, mobile roster performance, saved custom animals, existing presets, and full application checks. None of those UI changes or claims of 100-species runtime availability are part of this asset-only pack.

## Reproducing checks

From repository root, with Python 3 + Pillow and Node 24+:

```bash
python expansion/generate.py
python expansion/validate.py --sheets
node expansion/validate-simulation.mjs
npm_config_cache="$PWD/expansion/.cache" npm exec --yes --package=typescript@5.9.3 -- \
  tsc --noEmit --strict --target ES2022 --module ESNext \
  --moduleResolution bundler --resolveJsonModule expansion/typecheck.ts
```

`generate.py` is offline and deterministic. `prepare.py --research` performs fresh ADW requests and overwrites **only** the pack's initial retrieval audit; review new findings before recompiling. Supplemental reviewed references and model choices are explicit in `generate.py`. Image generation is not deterministic and cannot be reproduced by these scripts. `validate.py` fails on missing files, duplicate IDs/taxa, malformed values or source links, schema mismatches, invalid PNGs or missing real transparency. It reports strict framing separately and does not call a metadata pass an anatomical pass. No tool writes application assets.

Pack checks passed: 64 IDs, 64 species, 64 distinct new genera, all required species, 64 source records and briefs, seven finite racing fields per record, 64 PNGs, image hashes and actual transparent pixels, shared schema shape and enum compatibility, and 600 numerical race checks over 25/100/400/1000/5000/10000 m with monotonic finite finishes.

The unchanged app was additionally checked in an ignored verification copy under `expansion/.tooling/verification/` to keep all generated files within this directory: **typecheck, all 41 unit tests, and production build passed**. Lint reports the pre-existing `no-regex-spaces` error at `scripts/sync-animal-catalog.mjs:11`; ownership restrictions prohibit fixing that shared script here. Browser E2E tests were not run because this pack does not change the running app. See [validation.json](review/validation.json).

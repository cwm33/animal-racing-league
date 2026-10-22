# 100-species integration audit

Integration branch: `integration/100-species`, based on main
`979bce000f284d36173577f4a75766e29709cd48`. Main is not merged or deployed by this work.

## Inputs actually inspected

- [PR #3](https://github.com/cwm33/animal-racing-league/pull/3), actual branch
  `feat/roster-divisions`, commit `805ff36c8239c9d292dc148be524bce089f16592`.
  The requested `feature/divisions` name is not the remote head. Reviewed the diff,
  taxonomy map, simulation-based division thresholds, complete cache signature,
  matching, storage changes, pagination and browser tests.
- [PR #4](https://github.com/cwm33/animal-racing-league/pull/4), branch
  `feature/menagerie-assets`, commit `18afa03eb37ed20250e2f87669c9b05b13c9ce15`.
  It is a draft preparation pack, not a completed runtime expansion. Reviewed its
  64 records, source evidence, modelling rules, image hashes, anatomical briefs,
  generation replacements, validation scripts and disclosed art exceptions.

Both commits are retained through merge commits on the integration branch. No
unrelated main changes were replaced. The analytical simulation module is unchanged.

## Integration and repairs

The canonical roster now contains exactly 100 unique IDs and scientific-name
entries: 51 mammals, 16 birds, 12 reptiles, 6 amphibians and 15 invertebrates.
The original collection includes domestic forms/breeds and is retained as requested;
this is a game roster count, not a claim about species-rank uniformity.

The 64 records were appended to `src/data/animals.ts`, retaining every supplied
statistic. Full supplied taxonomy and adult/land metadata live in
`src/data/expansion-metadata.json`; all 100 entries have explicit browsing
classification in `src/data/taxonomy.ts`. Unknown velvet-worm order remains `null`.
The sengi is not classified as an elephant, the red panda is not a bear, and the
springhare is a rodent. Hoofed-mammal order labels retain the supplied
Artiodactyla/Cetartiodactyla conventions. New phylum/class/genus terms are searchable.

A new `slither` profile labels the rosy boa, earthworm and slug. It uses exactly the
crawl launch/fatigue coefficients (0.55/1.2), so imported race forecasts do not
change. Cosmetic undulation does not enter physics. Old saved crawl records and
all existing profiles still work; no storage migration or key change is required.

The editor resolves expansion research by immutable species ID. It loads the
canonical `src/data/provenance.json` on opening Biological context, showing per-field
units, preset values, evidence status, observed values, assumptions and source links.
It no longer presents the inherited generic `source: 'adw'` as the sole reference
for these species. Edited/custom presets are explicitly separated from evidence
for the original preset. Full research is a separate on-demand JavaScript chunk.

The catalog synchronizer's regular expression skipped names containing apostrophes
(e.g. Temminck's pangolin and Solórzano's velvet worm). It now parses literal tuples
with TypeScript, checks schema shape and rejects duplicate scientific names.

All 64 PNGs were initially **moved unchanged** from `expansion/originals/` to
`assets/animals/originals/`. Pack paths, the viewer and validation scripts follow
the move. A subsequent user-requested border repair adds transparent canvas
while retaining every original RGBA pixel, as recorded below. The cheetah style-reference hash and all original 36 PNGs remain intact.
The canonical art-direction dataset now contains 100 briefs. Derivatives and catalog
are generated through the normal commands. The asset validator now also detects
orphan files, manifest roster mismatch, altered derivatives and missing transparent
borders on the expansion WebPs. Source and derivative hashes are recorded. Thin-bodied stick-insect occupancy
uses an explicit 3% solid-pixel minimum (observed 4.36%) rather than the general
8% threshold, measured against the delivered authoring canvas so added padding does not change occupancy; real transparency and all framing checks still apply. Compositing
after resizing prevents alpha ringing from contaminating empty delivery borders.

The original 36 retain their previous derivative framing; new derivatives use a
maximum 300 px silhouette on a 384 px frame with a 342 px baseline. Only padding is
normalized. Source illustration pixels and anatomy are not altered. A clear 10% border is checked
on decoded pixels at all three delivery sizes, rounded up to a whole pixel.

## Biology and artwork review

Reviewed the eight supplied large contact sheets covering all 64 originals and the
64 px/32 px sheets. Additionally inspected native PNGs for silver ant, tarantula,
scorpion, coconut crab and velvet worm. Reviewed the regenerated quokka and visible
species cues: marsupial hind limbs, wombat body, pangolin scales, anteater muzzle,
okapi stripes, cassowary casque/wattles, kiwi bill, folded bird wings, skink tongue,
limbless boa, salamanders, arthropods and the legless earthworm/slug. No original
was replaced, and no missing art or citation was invented.

The broad identities, terrestrial adult scope and current scientific names were
checked against the supplied provenance, with fresh source spot checks:

- [ADW quokka](https://animaldiversity.org/accounts/Setonix_brachyurus/): identity,
  Diprotodontia/Macropodidae, small forelimbs/strong hindlimbs and 1.6–4.2 kg range.
- [ADW common wombat](https://animaldiversity.org/accounts/Vombatus_ursinus/):
  identity and Diprotodontia/Vombatidae.
- [ADW nine-banded armadillo](https://animaldiversity.org/accounts/Dasypus_novemcinctus/):
  identity and Cingulata/Dasypodidae; historical account scope remains qualified.
- [Pfeffer et al. 2019](https://journals.biologists.com/jeb/article/222/20/jeb198705/224418/High-speed-locomotion-in-the-Saharan-silver-ant):
  measured 855 mm/s maximum; the 0.8 m/s preset remains a rounded choice.

The PMC velvet-worm checklist returned a browser challenge during this audit; the
pack's taxonomic reference and earlier retrieval record are retained, not replaced
with an invented source. This audit does not claim fresh verification of every
quantitative statement in all references. Historical preparation reports remain
labelled as such in `expansion/README.md`.

Eight expansion masses remain explicit estimates: Gila monster, common toad,
six-spotted tiger beetle, silver ant, mantis, centipede, velvet worm and woodlouse.
Most top speeds and every acceleration/reserve/sustainable/fatigue/delay value are
model assumptions. Conflicting wolverine speed reports, hedgehog travel speed,
historical armadillo/red-panda scope and rosy-boa complex mass context remain
qualified. The on-demand panel exposes these assumptions. Long races do not imply
biologically sustainable endurance.

### Source-border repair and remaining acceptance blocker

The source-border blocker is resolved for all 64 expansion PNGs. An idempotent
`npm run assets:pad` step extends each delivered 1254×1254 canvas by 157 clear pixels
on every side to 1568×1568. Since ceil(1568 × 0.1) = 157, the entire required border
is exactly zero alpha. All original RGBA pixels—including faint interior alpha
noise—remain byte-for-byte identical within the inset canvas. There is no cropping,
resizing, alpha thresholding, anatomical editing or image regeneration.

`expansion/review/pre-border-image-checks.json` retains the delivered source hashes
and failed framing measurements. `expansion/review/border-repair.json` records the
input/output PNG hashes, inset rectangle and retained RGBA hash for each repair.
The repair command verifies pixel equality before saving and validates every saved
result on repeat runs. `npm run assets:pad -- --check`, asset validation and an
artifact regression test enforce both strict borders and pixel preservation.

**Fine anatomy remains unverified in stylized/occluded areas**, especially toes,
arthropod leg attachments, crab hidden appendages and many-legged segment counts.
Padding does not resolve that separate art-review limitation. The PR remains a
draft pending anatomical approval or explicit acceptance of those documented
limitations. The original 36 PNGs remain unchanged.

## Usability, accessibility, compatibility and performance

- Roster pages mount at most 36 cards (36/36/28 for 100 species). Filtering is
  memoized independently of bounded cached physics; distance/edited-stat changes
  recalculate actual simulation finishes against the full default benchmark.
- Browser audits at 1440×1000, 390×844 and 320×700 found no page or dialog horizontal
  overflow and no JavaScript errors. Native controls stay usable on narrow screens;
  the long roster scrolls inside the dialog. Search/filtering and three-page image
  coverage are exercised in desktop and mobile browser tests.
- Changing pages scrolls results into view and focuses the results group. Keyboard
  users can continue into the new cards. Escape/focus restoration, semantic controls,
  reduced motion and explicit playback remain covered.
- Normal roster requests use small responsive variants. Chromium can reuse a cached
  hero-size image; this avoids another request and is valid responsive behaviour.
  No full-resolution PNGs are deployed. The initial page mounts only the first 36
  roster images; off-page images are not in the DOM. Images use fixed frames and
  native lazy loading. Missing new art keeps the frame and visible species name,
  showing a neutral question mark; original emoji fallbacks remain supported.
- The production research chunk is loaded only when biological evidence is opened.
  The production build reports initial and research chunk sizes. Search interaction
  timings from the final dev-browser audit were 28–83 ms;
  these are observations, not a production latency guarantee.
- Regression fixtures pin all original animal records and PNG hashes to the main
  baseline. Tests also pin supplied new statistics/hashes, source evidence, all
  classification coverage, stable loading, defaults, quick presets, numerical
  continuity/finishes, matched variants, DNF handling and cache reuse.
- Automated axe WCAG A/AA scans supplement visual/keyboard review. They do not certify
  complete accessibility conformance.

## Validation record

Verified locally on 2026-10-22 with Node 24.19.0:

| Command                         | Result                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `npm run roster:sync`           | Pass; 100 identities                                          |
| `npm run roster:check`          | Pass; canonical/catalog agreement                             |
| `npm run assets:pad -- --check` | Pass; 64 strict source borders and exact retained RGBA hashes |
| `npm run assets:build`          | Pass; 100 PNGs and 300 WebP variants                          |
| `npm run assets:check`          | Pass; coverage, hashes, transparency and delivery borders     |
| `npm run assets:review`         | Pass; 18 review sheets and refreshed 100-entry preview        |
| `npm run typecheck`             | Pass                                                          |
| `npm run lint`                  | Pass                                                          |
| `npm test`                      | Pass; 67 unit tests                                           |
| `npm run test:e2e`              | Pass; 28 tests, 14 each on desktop and mobile                 |
| `npm run build`                 | Pass                                                          |

Additional checks: `python expansion/validate.py`,
`node expansion/validate-simulation.mjs` (600 numerical races), and `git diff --check`.
After border repair, the source validator reports **zero source-framing exceptions**;
fine-anatomy acceptance remains a separate review. All required technical commands pass after correcting
the integration failures described above.

Measured source PNG total after border repair: 114,398,313 bytes. Runtime WebP total: 3,659,192 bytes
(96 px: 363,354; 192 px: 899,342; 384 px: 2,396,496). All 100 source hashes are distinct.
All original 36 records, 36 PNGs and 108 WebPs match the main baseline. The 64
expansion PNG file hashes change because their canvases grow; their delivered
illustration pixels are retained exactly.

Production initial JavaScript: 354.91 kB / 109.08 kB gzip. CSS: 55.41 kB / 12.05 kB
gzip. The optional evidence chunk is 174.41 kB / 12.92 kB gzip. These are build totals;
the full artwork collection is not loaded on startup. Browser coverage decodes all
100 images across three pages and checks expanded evidence with axe.

After regeneration, visually inspected the combined 64/32 px collection preview and
representative production detail sheets (including the new mammals, frogs/arthropods,
and worm/slug/woodlouse page). Delivery padding is clear, all species are represented,
and the retained fine-anatomy exceptions remain visible for review.

The border follow-up refreshes source measurements and review sheets, adds source
border enforcement to `assets:check`, and verifies the lossless repair with
`npm run assets:pad -- --check`. Current source byte totals are in the regenerated manifest. Production rendering
normalizes visible bounds, so the added source padding does not change runtime
image sizes or illustration pixels.

The follow-up rebuild confirms all 300 runtime WebPs and the production collection
preview are byte-for-byte unchanged. The repaired source canvases therefore satisfy
the border requirement without changing any application rendering. All 67 unit
tests and 28 desktop/mobile browser tests pass.

# 🦛 Animal Racing League

**Fast paws. Wild science. Extremely questionable matchups.**

A complete browser-based racing playground built with React, TypeScript, and Vite. Race 36 species across 25 metres to 10 kilometres, tune their characteristics, and give a hippopotamus the turbo it never asked for.

Play Animal Racing League: **https://cwm33.github.io/animal-racing-league/**

## Run locally

Use Node.js **22.12+** (Node 24 also works) and npm.

```bash
npm ci
npm run dev
```

Open the printed URL, usually `http://localhost:5173/animal-racing-league/`.

```bash
npm run typecheck   # strict TypeScript
npm run lint        # ESLint, including React Hooks rules
npm test            # deterministic physics, playback, and persistence tests
npm run build       # type check + production bundle in dist/
npm run preview     # serve the production bundle
```

For browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

On Linux, `npx playwright install --with-deps chromium` also installs system dependencies. To use a preinstalled browser:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Browser tests cover biological/division filters, distance and edited-stat reclassification, matched and mixed lineups, legacy stable pagination, and desktop and mobile race controls, finishing results, roster search, comparisons, monster creation, saving/loading, reload persistence, custom distance entry, keyboard focus, reduced motion, DNF experiments, and automated WCAG A/AA checks with axe. Automated accessibility checks complement manual review; they do not certify complete conformance.

`npm run format` formats source; `npm run format:check` checks formatting.

## How to play

1. **Race day:** the initial lineup is ready. Press **Let them race**.
2. Choose a distance, add or remove species, or try **The classics**, **Endurance club**, or **Chaos crew**.
3. Pause, scrub, reset, replay, or change playback from 0.5× to 10×. The **smart clock** shows the winning sprint in 14 playback seconds, then compresses slower finishes into another 14 seconds. Disable it for a true simulated-time clock.
4. Click a competitor or its sliders to edit its stats. **Animal lab** exposes mass, sprint speed, launch acceleration, sprint reserve, sustainable pace, fatigue, launch delay, and locomotion.
5. Switch to **Unrestricted nonsense** or use **Make a monster**. A hippo with 15 m/s² acceleration is a welcome research participant.
6. **Save to stable** preserves a named creation in this browser. Load or delete it from the lab. Applying another configuration of a species replaces that species in the current lineup; the stable can hold multiple variants. Up to 100 creations are retained, newest first.
7. **Distance showdown** compares the current lineup over 25, 100, 400, 1,000, 5,000, and 10,000 m. Select a card to race that distance.
8. Reveal predicted results, run the race to reveal final results, inspect speed/distance curves, or download results as CSV.

Settings and saved configurations use local storage. There is no backend, account, API key, telemetry, or tracking. Clearing browser storage removes saved creations. The footer’s **Reset settings** restores the default lineup and preferences while keeping the stable. A separate **Species defaults** control resets an editor draft; apply it to update the lineup.

## Find your racing crowd

Open **Add competitors** from Race day (or **Add an animal** from the lab). The roster now combines biological browsing with predicted racing divisions:

- Search common/scientific names, descriptions, biological groups, orders, or families. For example, `Canidae` finds the three canines, and `Vulpes Carnivora` finds the fox.
- Filter **Biological group** and **Competitive division** together. Mammals has both an umbrella filter and narrower groups, including big cats, canines, hoofed mammals, marsupials, rodents, and primates. Birds, reptiles, amphibians, and invertebrates are supported; the current roster has no amphibians.
- Change **Race distance** in the roster to see predictions update immediately. This changes the actual race distance too. Cards show predicted finishing time and division; the race sidebar shows the same division. Current lineup edits, gait, launch delay, reference mass, and the mass-effects toggle all affect predictions.
- Open **Build a matched race**, choose an anchor under **Match pace with**, then **Race matched …** to replace the lineup with up to six unique species nearest its predicted finishing time, within its division and your active filters. At least two finishers are needed. Matching uses proportional time differences, so it works for seconds or days. The default anchor is the first finisher in a division with at least two different species (falling back to the first finisher); it can always be changed.
- Switch to **Saved stable** to search/filter saved variants and load their original statistics. Loading a variant replaces that species in the current lineup; out-of-range plausible stats automatically activate Unrestricted nonsense. Current edits appear in the species roster with their edited names; original species names remain searchable.
- Individual selection is always free to mix groups and divisions. Existing quick lineups, lab editing, and saving still work. **Clear filters** returns to the full species roster.

### How divisions are calculated

The benchmark is the fastest **unedited default species in the full league** at the selected distance, calculated with the existing simulation engine. Each competitor’s predicted finish time is divided by that benchmark. Filtering, selecting a different crowd, or creating a monster never changes the benchmark. When new species are intentionally added to the canonical roster, they become part of the default benchmark too.

| Division            | Predicted finish time / benchmark |
| ------------------- | --------------------------------- |
| Elite pace          | ≤ 1.5×                            |
| Contenders          | > 1.5× through 3×                 |
| Club racers         | > 3× through 8×                   |
| Leisure league      | > 8× through 30×                  |
| Scenic route        | > 30× through 300×                |
| Geological time     | > 300×                            |
| No predicted finish | DNF under the simulation model    |

Upper bounds are inclusive. A tiny ratio from an experimental monster still counts as Elite pace. These are playful game divisions, not measurements of biological fitness. They change with distance: the default cheetah is Elite pace at 25 m and Club racers at 10 km. A snail can take days and still have a real predicted finish; DNF is a separate case.

Taxonomy-inspired browsing groups use explicit species-ID metadata in `src/data/taxonomy.ts`, including order and family, separately from racing statistics. They intentionally mix taxonomic ranks: “big cats” is informal and includes the cheetah; “hoofed mammals” combines odd- and even-toed ungulates; “invertebrates” is an umbrella. A renamed turbo hippo stays a hoofed mammal. This is browsing metadata, not a complete taxonomic tree. Existing species identities and biological context remain in the canonical animal database and its linked references.

### Scaling and saved-data compatibility

`src/lib/divisions.ts` calls the unchanged analytical engine and keeps bounded LRU caches (4,096 numerical forecasts and 64 distance benchmarks). Keys include every physics input, distance, and mass-effects setting; changing names or artwork reuses the calculation, while stat edits recalculate it. `src/lib/roster.ts` builds search text once per roster/configuration update, then filters without running physics. The interface paginates at 36 cards and lazy-loads small responsive WebPs, so a 1,000-species roster never mounts 1,000 illustrations. Tests exercise 1,000 forecasts, cache reuse, and filtering; desktop/phone browser tests exercise paging with 100 legacy saved variants. Very large datasets may benefit from a search worker in a future version, but do not need a new rendering dependency for this scale.

No storage migration is required. Existing `arl:settings:v1` and `arl:library:v1` records, custom names/stats, species IDs, and quick presets remain compatible. Biological metadata and division membership are derived rather than copied into saved configurations. The old `category` value is retained for compatibility, but no longer controls roster filters or division labels.

## The physics, without the lab coat

The engine is a pure TypeScript module in `src/lib/simulation.ts`. Units are SI internally; the interface also shows km/h. Given identical settings, results are deterministic. Shuffle changes the lineup only.

For each competitor:

1. Wait for an optional launch delay.
2. Accelerate from rest at a constant effective acceleration to sprint speed.
3. Hold sprint speed for the configured sprint reserve (seconds **after reaching top speed**).
4. Fade exponentially toward sustainable pace:

   `v(u) = sustainable + (sprintSpeed − sustainable) × exp(−fatigue × u)`

Here `u` is elapsed time since the sprint reserve expired. Distance is integrated analytically in every phase. Launch and sprint finish times are solved directly; fatigue-phase finishes use an 80-iteration bracketed root search. Finishes are therefore resolved within phases rather than snapped to animation frames or a fixed integration step. `expm1` keeps very small decay values stable.

Optional **estimated mass effects** scale acceleration by `(originalMass / editedMass)^(1/3)` and speed by `(originalMass / editedMass)^(1/12)`. This is an invented geometric scaling assumption; it does not infer performance from mass alone. Each species has independent estimated speed, acceleration, endurance, and locomotion characteristics. Locomotion multiplies acceleration and fatigue:

| Profile          | Acceleration factor | Fatigue factor |
| ---------------- | ------------------: | -------------: |
| Gallop / run     |                   1 |              1 |
| Hop / bound      |                 0.9 |            0.9 |
| Bipedal run      |                0.85 |           0.85 |
| Waddle / shuffle |                0.65 |           1.15 |
| Crawl / haul     |                0.55 |            1.2 |

These coefficients are invented, not measured gait efficiencies. Gallop / run is a generic launch profile; it does not imply that elephants use a horse-like aerial gallop.

### Honest biology

All numerical animal attributes, including mass and top speed, are **rounded simulation presets**. Acceleration, reserve, fatigue, sustainable pace, gait coefficients, and mass effects are **speculative estimates**. Species notes distinguish established biological context from editable model assumptions. “Plausible” mode supplies broad limits, not species-specific scientific validation.

References in Field notes and the editor provide biological context:

- [Animal Diversity Web](https://animaldiversity.org/) — species accounts.
- [Wilson et al. (2013)](https://doi.org/10.1038/nature12295) — wild cheetah locomotion.
- [Bramble & Lieberman (2004)](https://doi.org/10.1038/nature03052) — human endurance running.

They do not substantiate the full set of racing numbers. Each of the 36 species has its own generated full-body illustration. Unicode emoji are retained only as a fallback when an image fails to load.

### Boundaries and unusual experiments

- All races are flat, straight **land** races. No swimming, flight, terrain, turns, injury, heat stress, feeding, sleep, or motivation is modelled.
- Long finishes are mathematical extrapolations of sustainable pace, not claims about an animal’s ability to race for days.
- Zero acceleration or zero sprint speed means no start. With zero sustainable pace, a runner may asymptotically stop short. **DNF** means it cannot reach the finish under the model, or cannot finish within the numerical horizon of `10^15` seconds (over 30 million years).
- Plausible mode limits sprint speed to 40 m/s, acceleration to 15 m/s², sprint reserve to 600 s, fatigue to 2/s, delay to 60 s, and sustainable pace to sprint speed.
- Unrestricted mode accepts deliberately absurd values, including sustainable pace exceeding sprint speed. It shares only numerical stability limits: finite nonnegative inputs up to `10^9`, mass at least `10^-6` kg, and any other positive value at least `10^-9`. Zero is accepted for every racing field except mass. Invalid entries produce an explicit error; they are not silently clamped.
- Equal finish times retain starting-lineup order for presentation. Animation is cosmetic and never changes results.
- Graphs expand the sprint and compress the tail when finishes differ widely: the time axis is linear to the first finish, then logarithmic. Tick labels and captions state the time scale. Isolating a competitor recomputes its graph scale.

## Project map

```text
src/data/animals.ts               36 presets and biological context
src/data/taxonomy.ts              explicit ID-based biological browsing metadata
src/lib/divisions.ts              cached distance-relative predicted divisions
src/lib/roster.ts                 search/filter index, saved variants, matched lineups
src/lib/types.ts                 typed models and locomotion profiles
src/lib/simulation.ts             pure analytical racing engine
src/lib/playback.ts               smart-clock mapping
src/lib/storage.ts                validated persistence and recovery
src/lib/*.test.ts                 unit and numerical regression tests
src/components/RaceDay.tsx        setup, playback, live track, results
src/components/PerformanceChart.tsx  native SVG performance curves
src/components/AnimalLab.tsx      editor and saved stable
src/components/DistanceShowdown.tsx  six-distance comparison
src/components/FieldNotes.tsx     model explanation and sources
e2e/league.spec.ts                desktop/mobile browser and axe checks
.github/workflows/deploy.yml      validation and Pages deployment
```

Production dependencies are React, React DOM, and Lucide icons. Native CSS, SVG, browser animation frames, and local storage handle the rest. External Google Fonts enhance typography; system sans-serif fallbacks keep the app functional if they cannot load. Illustrations are served as responsive transparent WebP files; optional error fallback emoji may vary by platform.

The interface includes semantic controls, labelled inputs, keyboard-operable dialogs with focus restoration, focus indicators, screen-reader descriptions, scrollable table regions, and reduced-motion support. Races never autoplay. Reduced motion disables bouncing and confetti; position changes still follow the explicit playback controls.

## GitHub Pages deployment

Vite’s base path is already `/animal-racing-league/`. The app uses in-page navigation, so no client-router rewrite or `404.html` workaround is needed. No secrets are required.

The workflow validates pull requests. Pushes to **main** (or a manual workflow run) perform type checks, lint, unit tests, desktop/mobile browser tests, and a production build, then upload `dist/` and deploy it using GitHub’s official Pages actions. Deployment uses narrowly scoped `pages: write` and `id-token: write` permissions and the `github-pages` environment.

**One-time repository setting:** Pages must use **GitHub Actions** as its source. “Deploy from a branch” serves repository files without running the Vite build. If an integration receives `403 Resource not accessible by integration` when changing this setting, the owner must select the source in the web interface:

1. Open [Settings → Pages](https://github.com/cwm33/animal-racing-league/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open [Actions](https://github.com/cwm33/animal-racing-league/actions), select **Validate and deploy to GitHub Pages**, and choose **Run workflow** on `main` (or rerun the failed deployment).
4. If GitHub requests approval for the `github-pages` environment, approve that deployment.
5. Wait for the deployment job to succeed, then open **https://cwm33.github.io/animal-racing-league/**.

If organization policy blocks Actions or Pages, the owner must allow them in repository/organization settings. If Pages later fails, inspect the deployment job rather than assuming a successful build means the site is live. After deployment, verify the application at the public URL rather than relying on the build result alone.

## Illustrated competitors

![All 36 illustrated competitors at 64 px and 32 px](assets/animals/collection-preview.webp)

The complete 36-species collection uses a shared premium, softly shaded 3D cartoon style. Every character faces right. The cheetah was generated first, inspected, and used as the visual reference for the remaining species. Prompts explicitly describe species-specific anatomy (including the platypus, elephant seal, pronghorn, and Hermann’s tortoise).

- Original transparent PNG artwork: `assets/animals/originals/{animal-id}.png`. Originals are retained unchanged and excluded from the production site's public directory.
- Runtime files: `public/animals/{animal-id}-{96,192,384}.webp`. Transparent padding is normalized onto a shared square frame and ground baseline. Original anatomy is not altered.
- [Collection review and original downloads](assets/animals/README.md).
- Art direction and species briefs: `assets/animals/art-direction.json`.
- Integrity and framing manifest: `assets/animals/manifest.json`.

```bash
npm run assets:build    # rebuild responsive WebP derivatives from the original PNGs
npm run assets:check    # verify all 36 originals and 108 runtime files, alpha and dimensions
npm run assets:review   # create full-detail, 64px and 32px review sheets in test-results/animal-art/
```

`AnimalSprite` is the shared presentation component; `AnimalAvatar` wraps it for roster/editor cards. Sprites also appear in the hero, racetrack, finishing results, comparison cards/tables, and recovery screen. It derives asset URLs from the stable animal ID and Vite's base path, preserving existing local-storage configurations. Fixed image frames prevent layout shifts, `srcSet` selects the appropriate WebP size, and an emoji is shown only after a failed image request.

Animations transform only an inner visual layer. The outer competitor position continues to use the unchanged racing engine. Running uses rhythmic bounce; bounding uses hop/compression; waddling uses gentle rocking; crawling uses small body movement; elephant seals have slow undulation. Cadence follows current simulated speed with conservative visual bounds, never feeds back into physics, and stops on pause or finish. Reduced-motion preferences disable these animations.

Browser tests additionally cover all 36 loaded illustrations, failed-image fallback sizing, every gait, and paused/reduced-motion behavior. CI checks asset integrity before the existing application checks and deployment.

## Adding more competitors

The project is prepared for a **100-species target**, but this commit does **not** add any animals or replace existing artwork. Species identities and racing parameters live in `src/data/animals.ts`; the asset catalog is generated from that source with `npm run roster:sync`. Add researched species entries there, maintain new-species source/provenance notes, and add matching anatomy briefs to `assets/animals/art-direction.json`. Consult `AGENTS.md` for the full research and image-quality checklist.

For each added species, create a right-facing transparent PNG using the existing cheetah artwork as the style reference, save it under `assets/animals/originals/<id>.png`, then run:

```bash
npm run roster:sync
npm run assets:build
npm run assets:check
npm run assets:review
npm run typecheck && npm run lint && npm test && npm run build
```

The asset validator and contact-sheet generator now derive roster counts and page counts from the catalog instead of assuming exactly 36 species. Existing asset IDs and original art are retained.

# 🦛 Animal Racing League

**Fast paws. Wild science. Extremely questionable matchups.**

A complete browser-based racing playground built with React, TypeScript, and Vite. Race 36 species across 25 metres to 10 kilometres, tune their characteristics, and give a hippopotamus the turbo it never asked for.

Target GitHub Pages URL: **https://cwm33.github.io/animal-racing-league/**

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

Browser tests cover desktop and mobile race controls, finishing results, roster search, comparisons, monster creation, saving/loading, reload persistence, custom distance entry, keyboard focus, reduced motion, DNF experiments, and automated WCAG A/AA checks with axe. Automated accessibility checks complement manual review; they do not certify complete conformance.

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

They do not substantiate the full set of racing numbers. The species icons are symbolic Unicode illustrations; several species have no dedicated emoji.

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

Production dependencies are React, React DOM, and Lucide icons. Native CSS, SVG, browser animation frames, and local storage handle the rest. External Google Fonts enhance typography; system sans-serif fallbacks keep the app functional if they cannot load. Emoji rendering varies by platform.

The interface includes semantic controls, labelled inputs, keyboard-operable dialogs with focus restoration, focus indicators, screen-reader descriptions, scrollable table regions, and reduced-motion support. Races never autoplay. Reduced motion disables bouncing and confetti; position changes still follow the explicit playback controls.

## GitHub Pages deployment

Vite’s base path is already `/animal-racing-league/`. The app uses in-page navigation, so no client-router rewrite or `404.html` workaround is needed. No secrets are required.

The workflow validates pull requests. Pushes to **main** (or a manual workflow run) perform type checks, lint, unit tests, desktop/mobile browser tests, and a production build, then upload `dist/` and deploy it using GitHub’s official Pages actions. Deployment uses narrowly scoped `pages: write` and `id-token: write` permissions and the `github-pages` environment.

**One-time repository setting:** this session’s GitHub integration received `403 Resource not accessible by integration` when attempting to enable Pages. The owner must enable the Pages source:

1. Open [Settings → Pages](https://github.com/cwm33/animal-racing-league/settings/pages).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Merge the implementation PR into `main` if it is still open.
4. Open [Actions](https://github.com/cwm33/animal-racing-league/actions), select **Validate and deploy to GitHub Pages**, and choose **Run workflow** on `main` (or rerun the failed deployment).
5. If GitHub requests approval for the `github-pages` environment, approve that deployment.
6. Wait for the deployment job to succeed, then open **https://cwm33.github.io/animal-racing-league/**.

If organization policy blocks Actions or Pages, the owner must allow them in repository/organization settings. If Pages later fails, inspect the deployment job rather than assuming a successful build means the site is live. The configured URL above is a target until a deployment is verified.

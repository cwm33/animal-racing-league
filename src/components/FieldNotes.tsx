import {
  ArrowUpRight,
  BookOpen,
  FlaskConical,
  Footprints,
  Heart,
  Scale,
  Timer,
} from 'lucide-react'
import { SOURCES } from '../data/animals'
export function FieldNotes() {
  return (
    <div className="notes-page">
      <div className="section-intro">
        <span className="eyebrow">A FIELD GUIDE TO FRIENDLY NONSENSE</span>
        <h2>
          A little biology.
          <br />A lot of “what if?”
        </h2>
        <p>
          This is an explainable toy model with real animal inspiration. Enjoy
          the experiments. Keep the claims modest.
        </p>
      </div>
      <div className="notes-grid">
        <article className="panel note-card">
          <BookOpen />
          <h3>What’s real?</h3>
          <p>
            Species names, basic locomotion, and the biological context describe
            real animals. Published cheetah locomotion and human endurance
            research inform the premise, not a calibrated universal model.
          </p>
          <p>
            Body masses and top speeds are rounded, illustrative presets. Real
            performance varies with age, sex, breed, motivation, substrate,
            temperature, and how much the animal objects to the premise.
          </p>
        </article>
        <article className="panel note-card orange-note">
          <FlaskConical />
          <h3>What’s invented?</h3>
          <p>
            Acceleration, sprint reserve, sustainable pace, fatigue rates, gait
            factors, and mass scaling are simulation estimates. They are not
            scientific measurements or species-specific predictions.
          </p>
          <p>
            “Plausible” mode adds broad guardrails. Unrestricted mode lets the
            hypotheses get wonderfully out of hand.
          </p>
        </article>
        <article className="panel note-card">
          <Footprints />
          <h3>Three phases. One finish line.</h3>
          <ol>
            <li>
              <strong>Launch:</strong> optional delay, then constant effective
              acceleration to sprint speed.
            </li>
            <li>
              <strong>Sprint:</strong> hold sprint speed for the configured
              reserve, measured in seconds after reaching top speed.
            </li>
            <li>
              <strong>Settle:</strong> speed decays exponentially toward
              sustainable pace. Higher fatigue makes that transition faster.
            </li>
          </ol>
          <p className="formula">
            v(t) = vₛ + (vₘₐₓ − vₛ)e<sup>−ku</sup>
          </p>
          <p>
            Here u is time since the sprint ends, vₛ is sustainable pace, and k
            is the effective fatigue rate. Exact distance integrals and a
            numerical root give the finish time.
          </p>
        </article>
        <article className="panel note-card">
          <Scale />
          <h3>Does a lighter hippo go faster?</h3>
          <p>
            Only if you enable estimated mass effects. We assume propulsive
            force scales roughly with cross-sectional area. Relative to original
            mass M₀, acceleration scales by (M₀/M)<sup>⅓</sup>, and speed by
            (M₀/M)<sup>¹⁄₁₂</sup>.
          </p>
          <p>
            Locomotion multiplies acceleration and fatigue. Gallop: 1 / 1;
            bound: 0.9 / 0.9; biped: 0.85 / 0.85; waddle: 0.65 / 1.15; crawl:
            0.55 / 1.2. These are invented coefficients, not a law of animal
            mechanics. “Gallop / run” is a generic launch profile, including
            grounded elephant motion.
          </p>
        </article>
        <article className="panel note-card">
          <Timer />
          <h3>Long races & tiny numbers</h3>
          <p>
            Sustainable pace lets the model cover anything from 25 metres to 10
            kilometres without carrying sprint speeds forever. It does not model
            heatstroke, injury, feeding, sleep, or real welfare. A days-long
            finish is mathematical extrapolation.
          </p>
          <p>
            Zero acceleration or zero sprint speed means no start. Zero
            sustainable pace may mean stopping short. DNF also covers the
            numerical horizon of 10¹⁵ seconds. For numerical stability, entries
            must be finite, nonnegative and at most 10⁹; mass must be at least
            10⁻⁶ kg, and positive values at least 10⁻⁹.
          </p>
          <p>
            The smart clock shows the first finisher over 14 playback seconds,
            then maps the rest of the race exponentially over another 14. You
            can turn it off for real simulated time.
          </p>
        </article>
        <article className="panel note-card">
          <Heart />
          <h3>A league for everyone</h3>
          <p>
            All races are flat, straight land races: no flying, swimming,
            terrain, or turns. The duck has lodged an appeal.
          </p>
          <p>
            Everything runs in your browser. Settings and saved creatures stay
            in local storage. No account or analytics. A reduced-motion
            preference disables runner bounce and confetti; playback starts only
            when you choose.
          </p>
          <p>
            Given the same settings, the race is deterministic. Shuffle only
            changes the lineup. It never changes the physics.
          </p>
        </article>
      </div>
      <section className="panel sources-panel">
        <div>
          <span className="eyebrow">READ THE REAL THING</span>
          <h2>Sources & further wandering</h2>
          <p className="subtle">
            These support the biological context. They do not validate the
            editable racing presets.
          </p>
        </div>
        {Object.values(SOURCES).map((source) => (
          <a
            href={source.url}
            key={source.url}
            target="_blank"
            rel="noreferrer"
          >
            {source.label}
            <ArrowUpRight size={18} />
          </a>
        ))}
      </section>
    </div>
  )
}

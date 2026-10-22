import provenance from '../data/provenance.json'

/** Loaded only when someone opens biological context, keeping research off the startup path. */
export default function SpeciesEvidence({ id }: { id: string }) {
  const record:
    | {
        fields: Record<
          string,
          {
            value: number
            unit: string
            status: string
            note: string
            evidence: {
              kind: string
              note: string
              sourceId: string
              valueKg?: unknown
              valueMps?: unknown
            }[]
          }
        >
        assumptions: string[]
        references: {
          id: string
          url: string
          title: string
          accessed: string
          evidenceNote: string
        }[]
      }
    | undefined = provenance.species.find((item) => item.speciesId === id)
  if (!record) return null
  return (
    <section className="species-evidence" aria-label="Species evidence">
      <p>
        Evidence for the species preset, before your edits. A source may support
        identity or mass alone. Missing performance evidence stays a model
        estimate. Long races omit rest, temperature, moisture, and motivation.
      </p>
      {['rosy-boa', 'earthworm', 'slug'].includes(id) && (
        <p>
          Slither / glide uses the preparation pack’s crawl coefficients. The
          new label and animation do not change these preset finish times.
        </p>
      )}
      <ul>
        {record.assumptions.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <dl>
        {Object.entries(record.fields).map(([field, evidence]) => (
          <div key={field}>
            <dt>
              {field} · {evidence.value} {evidence.unit}
            </dt>
            <dd>
              {evidence.status.replaceAll('_', ' ')}. {evidence.note}
              {evidence.evidence.map((item, index) => (
                <p key={index}>
                  {item.kind.replaceAll('_', ' ')}: {item.note}{' '}
                  {item.valueKg !== undefined && (
                    <>Reported kg: {JSON.stringify(item.valueKg)}. </>
                  )}
                  {item.valueMps !== undefined && (
                    <>Reported m/s: {JSON.stringify(item.valueMps)}. </>
                  )}
                  <a
                    href={
                      record.references.find((ref) => ref.id === item.sourceId)
                        ?.url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Evidence source ↗
                  </a>
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <ul>
        {record.references.map((ref) => (
          <li key={ref.id}>
            <a href={ref.url} target="_blank" rel="noreferrer">
              {ref.title} ↗
            </a>
            <p>
              Accessed {ref.accessed}. {ref.evidenceNote}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

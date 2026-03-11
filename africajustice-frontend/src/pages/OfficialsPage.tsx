import { FC, FormEvent, useEffect, useMemo, useState } from 'react'
import officialsService, { OfficialRecord } from '../services/officialsService'

const OfficialsPage: FC = () => {
  const [search, setSearch] = useState('')
  const [officials, setOfficials] = useState<OfficialRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const data = await officialsService.getOfficials()
        setOfficials(data)
      } catch {
        setError('Unable to load officials.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const filtered = useMemo(
    () =>
      officials.filter((official) =>
        `${official.name} ${official.position} ${official.agency} ${official.district || ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [officials, search],
  )

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') ?? ''),
      position: String(formData.get('position') ?? ''),
      agency: String(formData.get('agency') ?? ''),
      district: String(formData.get('district') ?? ''),
      trustScore: Number(formData.get('trustScore') ?? 50),
    }

    try {
      const created = await officialsService.createOfficial(payload)
      setOfficials((prev) => [created, ...prev])
      event.currentTarget.reset()
    } catch {
      setSubmitError('Unable to create official.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Public Officials</h1>
        <p className="jc-subtitle">Browse accountability signals, public role details, and trust ratings.</p>

        <div className="jc-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.7rem' }}>Add Official</h3>
          <form className="jc-form" onSubmit={onSubmit}>
            <label htmlFor="official-name">
              Name
              <input id="official-name" name="name" required />
            </label>
            <label htmlFor="official-position">
              Position
              <input id="official-position" name="position" required />
            </label>
            <label htmlFor="official-agency">
              Agency
              <input id="official-agency" name="agency" required />
            </label>
            <label htmlFor="official-district">
              District
              <input id="official-district" name="district" />
            </label>
            <label htmlFor="official-trust">
              Trust Score (0-100)
              <input id="official-trust" name="trustScore" type="number" min={0} max={100} defaultValue={50} />
            </label>
            <button className="jc-btn jc-btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Official'}
            </button>
            {submitError ? <p style={{ color: '#8f1f16' }}>{submitError}</p> : null}
          </form>
        </div>

        <label htmlFor="official-search" style={{ display: 'grid', gap: '0.4rem', marginBottom: '0.85rem' }}>
          Search official
          <input
            id="official-search"
            placeholder="Name, position, district..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {isLoading ? <p>Loading officials...</p> : null}
        {error ? <p style={{ color: '#8f1f16' }}>{error}</p> : null}

        <div className="jc-card">
          <table className="jc-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Office</th>
                <th>Agency</th>
                <th>District</th>
                <th>Trust Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>No officials found.</td>
                </tr>
              ) : null}
              {filtered.map((official) => (
                <tr key={official.id}>
                  <td>{official.name}</td>
                  <td>{official.position}</td>
                  <td>{official.agency}</td>
                  <td>{official.district || '-'}</td>
                  <td>{official.trustScore ?? 50}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default OfficialsPage

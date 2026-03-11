import { FC, FormEvent, useEffect, useState } from 'react'
import petitionsService, { PetitionRecord } from '../../services/petitionsService'

const PetitionCard: FC = () => {
  const [petitions, setPetitions] = useState<PetitionRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setError(null)
        const data = await petitionsService.getPetitions()
        setPetitions(data)
      } catch {
        setError('Unable to load petitions.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
    }

    try {
      const created = await petitionsService.createPetition(payload)
      setPetitions((prev) => [created, ...prev])
      event.currentTarget.reset()
    } catch {
      setSubmitError('Unable to create petition.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signPetition = async (id: string): Promise<void> => {
    try {
      const updated = await petitionsService.signPetition(id)
      setPetitions((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch {
      setError('Unable to sign petition right now.')
    }
  }

  return (
    <div className="jc-shell">
      <section className="jc-page">
        <h1>Petitions & Polls</h1>
        <p className="jc-subtitle">Mobilize public support and track institutional responses.</p>

        <div className="jc-card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.7rem' }}>Create Petition</h3>
          <form className="jc-form" onSubmit={onSubmit}>
            <label htmlFor="petition-title">
              Title
              <input id="petition-title" name="title" required />
            </label>
            <label htmlFor="petition-description">
              Description
              <textarea id="petition-description" name="description" required />
            </label>
            <button type="submit" className="jc-btn jc-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Petition'}
            </button>
            {submitError ? <p style={{ color: '#8f1f16' }}>{submitError}</p> : null}
          </form>
        </div>

        {isLoading ? <p>Loading petitions...</p> : null}
        {error ? <p style={{ color: '#8f1f16' }}>{error}</p> : null}
        {!isLoading && !error && petitions.length === 0 ? <p>No petitions yet. Create one above.</p> : null}

        <div className="jc-grid">
          {petitions.map((petition) => (
            <article key={petition.id} className="jc-card jc-col-4">
              <h3>{petition.title}</h3>
              <p style={{ marginTop: '0.55rem', color: 'var(--jc-ink-soft)' }}>{petition.description}</p>
              <p style={{ marginTop: '0.35rem', color: 'var(--jc-ink-soft)' }}>
                {petition.supporters} supporters - {petition.status}
              </p>
              <button
                type="button"
                className="jc-btn jc-btn-primary"
                style={{ marginTop: '0.8rem' }}
                onClick={() => {
                  void signPetition(petition.id)
                }}
              >
                Sign Petition
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default PetitionCard

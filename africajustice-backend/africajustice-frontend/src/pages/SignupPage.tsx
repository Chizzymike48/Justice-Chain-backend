import { FC, FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

const signupBenefits = [
  {
    title: 'Report cases with structure',
    description: 'Move from allegation intake to supporting evidence with a clearer, step-driven interface.',
  },
  {
    title: 'Track what happens next',
    description: 'Use the dashboard to follow progress, alerts, and priority tasks after submission.',
  },
  {
    title: 'Contribute to accountability',
    description: 'Participate in civic reporting, verification, and oversight from one connected product.',
  },
]

const SignupPage: FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { isLoggedIn, login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await authService.signup({
        name,
        email,
        password,
      })

      login({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        token: response.token,
      })

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="jc-shell">
      <section className="jc-auth-shell">
        <div className="jc-auth-panel">
          <p className="jc-eyebrow">Create workspace</p>
          <h1>Set up your JusticeChain account</h1>
          <p className="jc-subtitle jc-subtitle-lg">
            Register once to connect reporting, evidence uploads, verification requests, and follow-up actions inside a
            single civic accountability workflow.
          </p>

          <form className="jc-form" onSubmit={onSubmit}>
            <label className="jc-form-field" htmlFor="name">
              <div className="jc-form-field-header">
                <strong>Full name</strong>
                <span className="jc-input-hint">Use the name you want associated with your workspace.</span>
              </div>
              <input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="jc-form-field" htmlFor="email">
              <div className="jc-form-field-header">
                <strong>Email address</strong>
                <span className="jc-input-hint">This is how you will sign in and receive workflow updates.</span>
              </div>
              <input
                id="email"
                type="email"
                placeholder="you@example.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <div className="jc-form-row">
              <label className="jc-form-field" htmlFor="password">
                <div className="jc-form-field-header">
                  <strong>Password</strong>
                  <span className="jc-input-hint">Use at least 6 characters.</span>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <label className="jc-form-field" htmlFor="confirmPassword">
                <div className="jc-form-field-header">
                  <strong>Confirm password</strong>
                  <span className="jc-input-hint">Repeat the password to avoid mistakes.</span>
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            </div>

            {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

            <div className="jc-form-actions">
              <button className="jc-btn jc-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
              <Link to="/login" className="jc-btn jc-btn-ghost">
                Already have an account
              </Link>
            </div>
          </form>

          <p className="jc-auth-footer">
            Already registered? <Link to="/login">Login here</Link>.
          </p>
        </div>

        <aside className="jc-auth-aside">
          <p className="jc-card-kicker">What you unlock</p>
          <h2 className="jc-card-title">A cleaner path from issue capture to follow-up.</h2>
          <p>
            The updated onboarding flow now sets expectations better, so new users understand what they can do, what
            happens next, and where to go after the account is created.
          </p>

          <ul className="jc-auth-benefits">
            {signupBenefits.map((benefit) => (
              <li key={benefit.title} className="jc-auth-benefit">
                <strong>{benefit.title}</strong>
                <span>{benefit.description}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  )
}

export default SignupPage

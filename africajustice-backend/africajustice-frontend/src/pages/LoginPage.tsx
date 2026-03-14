import { FC, FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

const loginBenefits = [
  {
    title: 'Resume the workflow',
    description: 'Pick up reports, evidence uploads, and dashboard follow-up from the same account.',
  },
  {
    title: 'Stay on top of alerts',
    description: 'Track moderation, verification, and accountability updates without hunting through pages.',
  },
  {
    title: 'Use role-based access',
    description: 'Citizens and admins both land in clearer workspaces tailored to what they need to do next.',
  },
]

const LoginPage: FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { isLoggedIn, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const nextPath = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await authService.login(email, password)
      login({
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        token: response.token,
      })
      navigate(nextPath, { replace: true })
    } catch {
      setError('Login failed. Please verify your credentials or backend connection.')
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
          <p className="jc-eyebrow">Secure access</p>
          <h1>Sign in to continue your workflow</h1>
          <p className="jc-subtitle jc-subtitle-lg">
            Access your reporting dashboard, evidence queue, and follow-up actions. After login you will continue to{' '}
            <strong>{nextPath === '/dashboard' ? 'your dashboard' : nextPath}</strong>.
          </p>

          <form className="jc-form" onSubmit={onSubmit}>
            <label className="jc-form-field" htmlFor="email">
              <div className="jc-form-field-header">
                <strong>Email address</strong>
                <span className="jc-input-hint">Use the address tied to your JusticeChain account.</span>
              </div>
              <input
                id="email"
                type="email"
                placeholder="you@example.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="jc-form-field" htmlFor="password">
              <div className="jc-form-field-header">
                <strong>Password</strong>
                <span className="jc-input-hint">Keep your account secure and use a strong password.</span>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? <p className="jc-alert jc-alert-error">{error}</p> : null}

            <div className="jc-form-actions">
              <button className="jc-btn jc-btn-primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Continue'}
              </button>
              <Link to="/signup" className="jc-btn jc-btn-ghost">
                Create account
              </Link>
            </div>
          </form>

          <p className="jc-auth-footer">
            Do not have an account? <Link to="/signup">Create one here</Link>.
          </p>
        </div>

        <aside className="jc-auth-aside">
          <p className="jc-card-kicker">Why this matters</p>
          <h2 className="jc-card-title">A better workflow starts with a consistent workspace.</h2>
          <p>
            Login now leads more clearly into the next action, so users do not have to figure out whether they should
            report, upload evidence, or check their dashboard first.
          </p>

          <ul className="jc-auth-benefits">
            {loginBenefits.map((benefit) => (
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

export default LoginPage

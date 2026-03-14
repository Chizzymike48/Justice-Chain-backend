import { FC } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BellRing,
  ClipboardCheck,
  FilePlus2,
  FileSearch,
  Globe2,
  LayoutDashboard,
  Lock,
  Upload,
  UserPlus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface WorkflowStep {
  step: string
  title: string
  description: string
  icon: LucideIcon
}

interface ActionCard {
  title: string
  description: string
  path: string
  cta: string
  icon: LucideIcon
}

const trustSignals = ['Secure evidence intake', 'Moderated review pipeline', 'Public accountability records']

const workflowSteps: WorkflowStep[] = [
  {
    step: '01',
    title: 'Create a secure workspace',
    description: 'Start with a verified account so reports, evidence, and follow-up actions stay linked together.',
    icon: UserPlus,
  },
  {
    step: '02',
    title: 'Submit a report with context',
    description: 'Capture the issue, agency, timeline, and impact so reviewers can act without chasing missing details.',
    icon: FilePlus2,
  },
  {
    step: '03',
    title: 'Attach evidence and references',
    description: 'Upload supporting files and direct sources to improve the review speed and confidence of the case.',
    icon: Upload,
  },
  {
    step: '04',
    title: 'Track review and public outcomes',
    description: 'Follow moderation, verification, and accountability actions from your dashboard instead of losing the thread.',
    icon: ClipboardCheck,
  },
]

const citizenActions: ActionCard[] = [
  {
    title: 'Report corruption',
    description: 'Open a structured case intake flow with agency, amount, and narrative fields.',
    path: '/report-corruption',
    cta: 'Start report',
    icon: FilePlus2,
  },
  {
    title: 'Upload supporting evidence',
    description: 'Move directly from allegation capture to file submission without breaking context.',
    path: '/evidence-upload',
    cta: 'Add evidence',
    icon: Upload,
  },
  {
    title: 'Check your dashboard',
    description: 'See open items, priority alerts, and recommended actions in one place.',
    path: '/dashboard',
    cta: 'Open dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Review public projects',
    description: 'Track project delivery, risk, and execution progress from the same product.',
    path: '/projects',
    cta: 'Explore projects',
    icon: BarChart3,
  },
]

const adminActions: ActionCard[] = [
  {
    title: 'Open the moderation queue',
    description: 'Start with the highest-impact review work across reports and verification requests.',
    path: '/admin',
    cta: 'Go to admin dashboard',
    icon: ClipboardCheck,
  },
  {
    title: 'Review submitted reports',
    description: 'Inspect new allegations quickly with a clearer path from queue to decision.',
    path: '/admin/reports',
    cta: 'Review reports',
    icon: FileSearch,
  },
  {
    title: 'Inspect uploaded evidence',
    description: 'Move through media review without leaving the broader accountability workflow.',
    path: '/admin/evidence',
    cta: 'Review evidence',
    icon: Upload,
  },
  {
    title: 'Manage platform access',
    description: 'Handle users, roles, and operational governance from a dedicated workspace.',
    path: '/admin/users',
    cta: 'Manage users',
    icon: LayoutDashboard,
  },
]

const featureCards = [
  {
    title: 'Protected submissions',
    description: 'Evidence and allegations move through a secure intake and review path.',
    icon: Lock,
  },
  {
    title: 'Real-time follow-up',
    description: 'Users can spot workflow changes and priority alerts faster from a connected dashboard.',
    icon: BellRing,
  },
  {
    title: 'Public accountability layer',
    description: 'Verified records can support broader transparency and community oversight.',
    icon: Globe2,
  },
]

const Home: FC = () => {
  const { isLoggedIn, user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'investigator'
  const roleActions = isAdmin ? adminActions : citizenActions

  return (
    <div className="jc-shell">
      <section className="jc-hero">
        <div className="jc-hero-panel">
          <p className="jc-eyebrow">Civic accountability platform</p>
          <h1>From citizen report to public accountability, in one clear workflow.</h1>
          <p className="jc-subtitle jc-subtitle-lg">
            JusticeChain helps communities document cases, upload evidence, verify claims, and track outcomes without
            losing context between steps.
          </p>

          <div className="jc-pills">
            {trustSignals.map((signal) => (
              <span key={signal} className="jc-pill">
                {signal}
              </span>
            ))}
          </div>

          <div className="jc-page-header-actions">
            {isLoggedIn ? (
              <>
                <Link className="jc-btn jc-btn-primary" to={isAdmin ? '/admin' : '/report-corruption'}>
                  {isAdmin ? 'Open admin workspace' : 'Start a report'}
                </Link>
                <Link className="jc-btn jc-btn-ghost" to="/dashboard">
                  View dashboard
                </Link>
              </>
            ) : (
              <>
                <Link className="jc-btn jc-btn-primary" to="/signup">
                  Create account
                </Link>
                <Link className="jc-btn jc-btn-secondary" to="/login">
                  Login
                </Link>
              </>
            )}
          </div>

          <div className="jc-hero-metrics">
            <div className="jc-hero-stat">
              <strong>4-step</strong>
              <span>core reporting workflow</span>
            </div>
            <div className="jc-hero-stat">
              <strong>1 dashboard</strong>
              <span>for reports, alerts, and follow-up</span>
            </div>
            <div className="jc-hero-stat">
              <strong>Role-aware</strong>
              <span>citizen and admin workspaces</span>
            </div>
          </div>
        </div>

        <aside className="jc-hero-panel jc-hero-panel--brand">
          <p className="jc-card-kicker">Workflow map</p>
          <h2 className="jc-card-title">Capture, verify, escalate, publish.</h2>
          <p>
            The product now emphasizes the journey users actually take, so every major screen points to the next action
            instead of leaving people to figure it out alone.
          </p>

          <ol className="jc-timeline">
            <li>
              <span className="jc-timeline-step">1</span>
              <div className="jc-timeline-text">
                <strong className="jc-timeline-title">Intake</strong>
                Collect a clean report with enough detail for moderation.
              </div>
            </li>
            <li>
              <span className="jc-timeline-step">2</span>
              <div className="jc-timeline-text">
                <strong className="jc-timeline-title">Evidence</strong>
                Attach files and references while the case context is still fresh.
              </div>
            </li>
            <li>
              <span className="jc-timeline-step">3</span>
              <div className="jc-timeline-text">
                <strong className="jc-timeline-title">Review</strong>
                Move through verification and moderation with visible status updates.
              </div>
            </li>
            <li>
              <span className="jc-timeline-step">4</span>
              <div className="jc-timeline-text">
                <strong className="jc-timeline-title">Accountability</strong>
                Turn verified work into a stronger public record and decision trail.
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <section className="jc-section">
        <div className="jc-section-heading">
          <div>
            <h2>Built around a stronger product flow</h2>
            <p className="jc-section-copy">
              Instead of a flat list of pages, the interface now makes the reporting lifecycle visible and easier to
              follow.
            </p>
          </div>
        </div>

        <div className="jc-grid">
          {workflowSteps.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.step} className="jc-card jc-col-3">
                <p className="jc-card-kicker">Step {item.step}</p>
                <div
                  style={{
                    display: 'inline-flex',
                    width: '2.6rem',
                    height: '2.6rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '18px',
                    background: 'rgba(var(--jc-brand-rgb), 0.1)',
                    color: 'var(--jc-brand-strong)',
                  }}
                >
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <h3 className="jc-card-title">{item.title}</h3>
                <p className="jc-muted">{item.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="jc-section">
        <div className="jc-section-heading">
          <div>
            <h2>{isAdmin ? 'Admin priorities' : isLoggedIn ? 'Recommended next actions' : 'What you can do once inside'}</h2>
            <p className="jc-section-copy">
              {isAdmin
                ? 'The admin workspace surfaces moderation work, evidence review, and governance tasks faster.'
                : isLoggedIn
                  ? 'Your workspace now points clearly to the next action instead of leaving you on a static landing page.'
                  : 'New users can move from onboarding to action with less friction.'}
            </p>
          </div>
        </div>

        <div className="jc-grid">
          {roleActions.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="jc-card jc-col-6 jc-card--accent">
                <div
                  style={{
                    display: 'inline-flex',
                    width: '2.6rem',
                    height: '2.6rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    color: 'var(--jc-brand-strong)',
                  }}
                >
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <h3 className="jc-card-title">{item.title}</h3>
                <p className="jc-muted">{item.description}</p>
                <Link to={item.path} className="jc-btn jc-btn-primary">
                  {item.cta}
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="jc-section">
        <div className="jc-section-heading">
          <div>
            <h2>Confidence-building product details</h2>
            <p className="jc-section-copy">
              Good civic software needs more than forms. It needs visible trust signals, clear states, and strong
              follow-up paths.
            </p>
          </div>
        </div>

        <div className="jc-grid">
          {featureCards.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="jc-card jc-col-4">
                <div
                  style={{
                    display: 'inline-flex',
                    width: '2.6rem',
                    height: '2.6rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '18px',
                    background: 'rgba(var(--jc-accent-rgb), 0.08)',
                    color: '#1e3a8a',
                  }}
                >
                  <Icon size={18} strokeWidth={2.1} />
                </div>
                <h3 className="jc-card-title">{item.title}</h3>
                <p className="jc-muted">{item.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="jc-section">
        <article className="jc-card jc-card--brand">
          <p className="jc-card-kicker">Ready to move forward</p>
          <h2 className="jc-card-title">
            {isLoggedIn ? 'Continue from your workspace.' : 'Set up your account and start reporting with structure.'}
          </h2>
          <p>
            {isLoggedIn
              ? 'The updated interface is designed to reduce hesitation between pages and keep users moving through the workflow.'
              : 'Create an account to connect reports, evidence, verification history, and dashboard follow-up in one system.'}
          </p>
          <div className="jc-page-header-actions">
            <Link className="jc-btn jc-btn-secondary" to={isLoggedIn ? '/dashboard' : '/signup'}>
              {isLoggedIn ? 'Go to dashboard' : 'Create account'}
            </Link>
            <Link
              className="jc-btn jc-btn-ghost"
              to={isLoggedIn ? (isAdmin ? '/admin/reports' : '/report-corruption') : '/login'}
            >
              {isLoggedIn ? (isAdmin ? 'Open moderation queue' : 'Start report intake') : 'Login instead'}
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

export default Home

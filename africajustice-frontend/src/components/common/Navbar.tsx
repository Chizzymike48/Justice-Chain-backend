import { FC, useState } from 'react'
import {
  ChevronDown,
  Compass,
  FilePlus2,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  RadioTower,
  ShieldCheck,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

interface NavItem {
  path: string
  label: string
  description: string
  requiresAuth?: boolean
}

interface NavGroup {
  label: string
  description: string
  items: NavItem[]
  icon: LucideIcon
  requiresAuth?: boolean
  adminOnly?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: 'Home',
    description: 'Start here for the platform overview and main actions.',
    icon: Home,
    items: [{ path: '/', label: 'Overview', description: 'See the reporting, verification, and accountability workflow.' }],
  },
  {
    label: 'Live Streams',
    description: 'Watch current civic coverage and publish authenticated stream links.',
    icon: RadioTower,
    items: [
      {
        path: '/livestreams',
        label: 'Live Streams',
        description: 'Open the stream hub for active broadcasts, scheduled coverage, and publishing.',
      },
    ],
  },
  {
    label: 'Report and Evidence',
    description: 'Submit cases, civic issues, and supporting files in a guided workflow.',
    icon: FilePlus2,
    requiresAuth: true,
    items: [
      {
        path: '/report-corruption',
        label: 'Report Corruption',
        description: 'Capture a case with the agency, amount, narrative, and factual references.',
        requiresAuth: true,
      },
      {
        path: '/report-issue',
        label: 'Report Civic Issue',
        description: 'Log service delivery gaps affecting roads, health, water, or education.',
        requiresAuth: true,
      },
      {
        path: '/evidence-upload',
        label: 'Upload Evidence',
        description: 'Attach documents, images, audio, and other supporting material.',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Review and Verify',
    description: 'Validate claims, inspect patterns, and follow verification outcomes.',
    icon: ShieldCheck,
    requiresAuth: true,
    items: [
      {
        path: '/verify',
        label: 'Verify Claims',
        description: 'Start a verification request and review recent checks.',
        requiresAuth: true,
      },
      {
        path: '/analytics',
        label: 'Analytics',
        description: 'Review governance signals, trends, and anomaly indicators.',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Explore',
    description: 'Browse public projects, officials, petitions, and community oversight data.',
    icon: Compass,
    requiresAuth: true,
    items: [
      {
        path: '/projects',
        label: 'Public Projects',
        description: 'Monitor delivery, progress, and execution risk across public projects.',
        requiresAuth: true,
      },
      {
        path: '/officials',
        label: 'Government Officials',
        description: 'Review officials, offices, and public accountability context.',
        requiresAuth: true,
      },
      {
        path: '/track-projects',
        label: 'Track Projects',
        description: 'Follow priority projects and keep an eye on delivery milestones.',
        requiresAuth: true,
      },
      {
        path: '/petitions',
        label: 'Petitions and Polls',
        description: 'Support collective civic actions and gather community sentiment.',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Workspace',
    description: 'Track your queue, recent activity, and recommended next steps.',
    icon: LayoutDashboard,
    requiresAuth: true,
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        description: 'See your reports, alerts, and workflow priorities in one place.',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Help & Guide',
    description: 'Learn how to use the platform effectively.',
    icon: HelpCircle,
    items: [
      {
        path: '/help',
        label: 'Help & Guidance',
        description: 'Complete guide with tutorials, FAQs, and best practices.',
      },
      {
        path: '/chat',
        label: 'AI Assistant',
        description: 'Chat with our AI for instant help with reporting and navigation.',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Admin',
    description: 'Moderate reports, evidence, verifications, and user access.',
    icon: Users,
    requiresAuth: true,
    adminOnly: true,
    items: [
      {
        path: '/admin',
        label: 'Admin Dashboard',
        description: 'Monitor queue health, moderation load, and platform operations.',
        requiresAuth: true,
      },
      {
        path: '/admin/reports',
        label: 'Review Reports',
        description: 'Approve, reject, or escalate submitted reports.',
        requiresAuth: true,
      },
      {
        path: '/admin/evidence',
        label: 'Review Evidence',
        description: 'Inspect uploaded files and supporting materials.',
        requiresAuth: true,
      },
      {
        path: '/admin/verifications',
        label: 'Review Verifications',
        description: 'Moderate verification requests and confidence scoring.',
        requiresAuth: true,
      },
      {
        path: '/admin/users',
        label: 'Manage Users',
        description: 'Maintain account access, roles, and operational governance.',
        requiresAuth: true,
      },
    ],
  },
]

const Navbar: FC = () => {
  const { isLoggedIn, logout, user } = useAuth()
  const navigate = useNavigate()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'investigator'

  const onLogout = (): void => {
    logout()
    navigate('/')
    setOpenDropdown(null)
    setMenuOpen(false)
  }

  const toggleDropdown = (label: string): void => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  const visibleGroups = navGroups.filter((group) => {
    const shouldShow = !group.requiresAuth || isLoggedIn
    const shouldShowAdmin = !group.adminOnly || isAdmin
    return shouldShow && shouldShowAdmin
  })

  return (
    <header className="jc-navbar">
      <div className="jc-nav-inner">
        <div className="jc-brand-wrap">
          <div className="jc-brand-mark" aria-hidden="true">
            JC
          </div>
          <div className="jc-brand-text">
            <NavLink to="/" className="jc-brand">
              JusticeChain
            </NavLink>
            <span className="jc-brand-tagline">Citizen reporting, verification, and accountability workflows.</span>
          </div>
        </div>

        <nav className="jc-nav-links" aria-label="Primary">
          {visibleGroups.map((group) => {
            const Icon = group.icon
            const isSingleItem = group.items.length === 1 && !group.adminOnly
            const singleItem = group.items[0]

            if (isSingleItem) {
              return (
                <NavLink
                  key={group.label}
                  to={singleItem.path}
                  className={({ isActive }) => `jc-nav-link${isActive ? ' active' : ''}`}
                >
                  <Icon size={16} strokeWidth={2.1} />
                  <span>{singleItem.label}</span>
                </NavLink>
              )
            }

            return (
              <div key={group.label} className="jc-dropdown-wrapper">
                <button
                  type="button"
                  className={`jc-nav-link jc-dropdown-toggle${openDropdown === group.label ? ' active' : ''}`}
                  onClick={() => toggleDropdown(group.label)}
                  aria-expanded={openDropdown === group.label}
                >
                  <Icon size={16} strokeWidth={2.1} />
                  <span>{group.label}</span>
                  <ChevronDown size={16} strokeWidth={2.1} />
                </button>

                {openDropdown === group.label ? (
                  <div className="jc-dropdown-menu">
                    <div className="jc-dropdown-header">
                      <p className="jc-dropdown-label">{group.label}</p>
                      <p className="jc-dropdown-description">{group.description}</p>
                    </div>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className="jc-dropdown-item"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <span className="jc-dropdown-item-title">{item.label}</span>
                        <span className="jc-dropdown-item-text">{item.description}</span>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="jc-nav-actions">
          {isLoggedIn ? (
            <div className="jc-user-pill">
              <UserCircle2 size={18} strokeWidth={2.1} />
              <span>
                <strong>{user?.name ?? 'Citizen'}</strong>
                <small>{isAdmin ? 'Admin workspace' : 'Citizen workspace'}</small>
              </span>
            </div>
          ) : null}

          <LanguageSwitcher />

          <div className="jc-nav-auth-desktop">
            {isLoggedIn ? (
              <button type="button" onClick={onLogout} className="jc-btn jc-btn-secondary">
                <LogOut size={16} strokeWidth={2.1} />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <NavLink to="/login" className="jc-btn jc-btn-secondary">
                  Login
                </NavLink>
                <NavLink to="/signup" className="jc-btn jc-btn-primary">
                  Create account
                </NavLink>
              </>
            )}
          </div>

          <button
            type="button"
            className="jc-menu-button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? <X size={18} strokeWidth={2.1} /> : <Menu size={18} strokeWidth={2.1} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="jc-mobile-nav">
          <div className="jc-mobile-nav-panel">
            {isLoggedIn ? (
              <div className="jc-mobile-user-card">
                <p className="jc-card-kicker">Signed in</p>
                <strong>{user?.name ?? user?.email ?? 'Citizen user'}</strong>
                <span>{isAdmin ? 'Admin tools available' : 'Reporting tools available'}</span>
              </div>
            ) : null}

            <div className="jc-mobile-nav-groups">
              {visibleGroups.map((group) => {
                const Icon = group.icon
                return (
                  <section key={group.label} className="jc-mobile-group">
                    <div className="jc-mobile-group-header">
                      <span className="jc-mobile-group-icon">
                        <Icon size={16} strokeWidth={2.1} />
                      </span>
                      <div>
                        <strong>{group.label}</strong>
                        <p>{group.description}</p>
                      </div>
                    </div>

                    <div className="jc-mobile-group-items">
                      {group.items.map((item) => (
                        <NavLink key={item.path} to={item.path} className="jc-mobile-item">
                          <span>{item.label}</span>
                          <small>{item.description}</small>
                        </NavLink>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <div className="jc-mobile-nav-actions">
              {isLoggedIn ? (
                <button type="button" onClick={onLogout} className="jc-btn jc-btn-secondary jc-btn-block">
                  <LogOut size={16} strokeWidth={2.1} />
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <NavLink to="/login" className="jc-btn jc-btn-secondary jc-btn-block">
                    Login
                  </NavLink>
                  <NavLink to="/signup" className="jc-btn jc-btn-primary jc-btn-block">
                    Create account
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default Navbar

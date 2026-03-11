import { FC, ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp, Search, HelpCircle, Shield, Zap, Users, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { helpContent } from '../utils/contextual-help'
import '../styles/help-guide.css'

interface FaqItem {
  q: string
  a: string
  open?: boolean
}

interface SectionProps {
  id: string
  title: string
  icon: LucideIcon
  expandedSection: string | null
  onToggle: (section: string) => void
  children: ReactNode
}

const Section: FC<SectionProps> = ({ id, title, icon: Icon, expandedSection, onToggle, children }) => (
  <div className="help-section">
    <button
      className="help-section-header"
      onClick={() => onToggle(id)}
      aria-expanded={expandedSection === id}
    >
      <Icon size={20} className="help-section-icon" />
      <h2>{title}</h2>
      {expandedSection === id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
    {expandedSection === id && <div className="help-section-content">{children}</div>}
  </div>
)

const HelpGuidePage: FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started')
  const [searchTerm, setSearchTerm] = useState('')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const allFaqs: FaqItem[] = helpContent.faqs

  const filteredFaqs = allFaqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="help-guide-page">
      <div className="help-header">
        <h1>📚 Help & Guidance</h1>
        <p>Learn how to use AfricaJustice effectively and report corruption with impact</p>
      </div>

      {/* Quick Search */}
      <div className="help-search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search help topics, FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="help-search-input"
        />
      </div>

      {/* Navigation Cards */}
      <div className="help-nav-cards">
        <button
          className="nav-card getting-started"
          onClick={() => setExpandedSection('getting-started')}
        >
          <Zap size={24} />
          <h3>Getting Started</h3>
          <p>4 easy steps to start reporting</p>
        </button>
        <button
          className="nav-card livestream"
          onClick={() => setExpandedSection('livestream')}
        >
          <Zap size={24} />
          <h3>Live Recording</h3>
          <p>Record incidents in real-time</p>
        </button>
        <button
          className="nav-card reporting"
          onClick={() => setExpandedSection('reporting')}
        >
          <BookOpen size={24} />
          <h3>Reporting</h3>
          <p>Document corruption &amp; issues</p>
        </button>
        <button
          className="nav-card verification"
          onClick={() => setExpandedSection('verification')}
        >
          <Users size={24} />
          <h3>Verification</h3>
          <p>Strengthen community claims</p>
        </button>
        <button
          className="nav-card safety"
          onClick={() => setExpandedSection('safety')}
        >
          <Shield size={24} />
          <h3>Safety &amp; Privacy</h3>
          <p>Your data and personal security</p>
        </button>
      </div>

      {/* Getting Started Section */}
      <Section id="getting-started" title="🚀 Getting Started" icon={Zap} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="getting-started-steps">
          {Object.entries(helpContent.getting_started).map(([key, step], idx) => (
            <div key={key} className="step-card">
              <div className="step-number">{idx + 1}</div>
              <div className="step-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
                <small>⏱️ {step.time}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="tip-box">
          <strong>💡 Pro Tip:</strong> Start with one report to get comfortable with the process.
          Each submission helps build accountability.
        </div>
      </Section>

      {/* Authentication */}
      <Section id="auth" title="🔐 Account & Authentication" icon={Shield} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.auth.signup.title}</h3>
          <p>{helpContent.auth.signup.description}</p>
          <h4>Steps to Sign Up:</h4>
          <ol>
            {helpContent.auth.signup.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="tip-box">
            <strong>💡 {helpContent.auth.signup.tip}</strong>
          </div>
        </div>
      </Section>

      {/* Live Streaming */}
      <Section id="livestream" title="🎥 Live Recording" icon={Zap} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.livestream.goLive.title}</h3>
          <p>{helpContent.livestream.goLive.description}</p>

          <h4>Quick Start</h4>
          <p>{helpContent.livestream.goLive.quickStart}</p>

          <h4>Your Options:</h4>
          {helpContent.livestream.goLive.options.map((option, i) => (
            <div key={i} className="option-box">
              <h5>📌 {option.label}</h5>
              <p>{option.description}</p>
              <ul>
                {option.tips.map((tip, j) => (
                  <li key={j}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}

          <h4>What Happens After You Submit:</h4>
          <ul>
            {helpContent.livestream.goLive.what_happens_next.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>

          <h4>Best Practices for Recording:</h4>
          <ul>
            {helpContent.livestream.goLive.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <div className="warning-box">
            <strong>⚠️ Safety Notice:</strong> {helpContent.livestream.goLive.safety}
          </div>
        </div>
      </Section>

      {/* Reporting */}
      <Section id="reporting" title="📝 Reporting Incidents" icon={BookOpen} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.reporting.corruptionReport.title}</h3>
          <p>{helpContent.reporting.corruptionReport.description}</p>

          <h4>What Counts as Corruption:</h4>
          <ul>
            {helpContent.reporting.corruptionReport.what_counts_as_corruption.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4>How to Write a Strong Report:</h4>
          <ol>
            {helpContent.reporting.corruptionReport.how_to_report.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <h4>Best Practices:</h4>
          <ul>
            {helpContent.reporting.corruptionReport.best_practices.map((practice, i) => (
              <li key={i}>{practice}</li>
            ))}
          </ul>

          <div className="info-box">
            <strong>🔒 Privacy:</strong> {helpContent.reporting.corruptionReport.privacy}
          </div>

          <h4>What Happens Next:</h4>
          <ol>
            {helpContent.reporting.corruptionReport.what_happens.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Evidence */}
      <Section id="evidence" title="📎 Submitting Evidence" icon={BookOpen} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.evidence.submitEvidence.title}</h3>
          <p>{helpContent.evidence.submitEvidence.description}</p>

          <h4>Accepted File Formats:</h4>
          <div className="file-formats">
            <div>
              <strong>Documents:</strong> {helpContent.evidence.submitEvidence.accepted_formats.documents}
            </div>
            <div>
              <strong>Media:</strong> {helpContent.evidence.submitEvidence.accepted_formats.media}
            </div>
            <div>
              <strong>Size Limits:</strong> {helpContent.evidence.submitEvidence.accepted_formats.size_limits}
            </div>
          </div>

          <h4>Good Evidence Includes:</h4>
          <ul>
            {helpContent.evidence.submitEvidence.good_evidence.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4>Tips for File Quality:</h4>
          <ul>
            {helpContent.evidence.submitEvidence.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <div className="info-box">
            <strong>🔐 Security:</strong> {helpContent.evidence.submitEvidence.security}
          </div>
        </div>
      </Section>

      {/* Verification */}
      <Section id="verification" title="✅ Verification System" icon={Users} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.verification.verifyClaimTitle}</h3>
          <p>{helpContent.verification.description}</p>

          <h4>How Verification Works:</h4>
          <ol>
            {helpContent.verification.how_it_works.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <h4>Confidence Levels Explained:</h4>
          <div className="verification-levels">
            {helpContent.verification.verification_levels.map((level, i) => (
              <div key={i} className="verification-level">
                <strong>{level.level}</strong>
                <p>{level.meaning}</p>
              </div>
            ))}
          </div>

          <h4>Tips for Good Verification:</h4>
          <ul>
            {helpContent.verification.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>

          <div className="impact-box">
            <strong>🎯 Your Impact:</strong> {helpContent.verification.impact}
          </div>
        </div>
      </Section>

      {/* Projects & Tracking */}
      <Section id="projects" title="📊 Projects &amp; Tracking" icon={BookOpen} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h3>{helpContent.projects.createProject.title}</h3>
          <p>{helpContent.projects.createProject.description}</p>

          <h4>What to Include in a Project:</h4>
          <ul>
            {helpContent.projects.createProject.what_to_include.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <p>
            <strong>How Citizens Help:</strong> {helpContent.projects.createProject.how_citizens_help}
          </p>
        </div>
      </Section>

      {/* Safety & Privacy */}
      <Section id="safety" title="🛡️ Safety &amp; Privacy" icon={Shield} expandedSection={expandedSection} onToggle={toggleSection}>
        <div className="help-subsection">
          <h4>💪 Protecting Yourself:</h4>
          <ul>
            {helpContent.safety_and_privacy.protecting_yourself.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4>🔒 Your Data:</h4>
          <ul>
            {helpContent.safety_and_privacy.your_data.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4>⚖️ Legal Information:</h4>
          <ul>
            {helpContent.safety_and_privacy.legal.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <div className="warning-box">
            <strong>⚠️ Important:</strong> If you face threats or retaliation, contact local authorities
            and our support team immediately.
          </div>
        </div>
      </Section>

      {/* FAQs */}
      <div className="help-section faq-section">
        <div className="help-section-header">
          <HelpCircle size={20} />
          <h2>❓ Frequently Asked Questions</h2>
          <span className="faq-count">{filteredFaqs.length}</span>
        </div>

        {searchTerm && (
          <div className="faq-search-results">
            Showing {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchTerm}"
          </div>
        )}

        <div className="faq-list">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const originalIndex = allFaqs.indexOf(faq)
              return (
                <div key={originalIndex} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaqIndex(openFaqIndex === originalIndex ? null : originalIndex)}
                  >
                    <span>{faq.q}</span>
                    {openFaqIndex === originalIndex ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {openFaqIndex === originalIndex && <div className="faq-answer">{faq.a}</div>}
                </div>
              )
            })
          ) : (
            <div className="no-results">
              No FAQs match your search. Try different keywords or browse sections above.
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="help-support-section">
        <h3>📞 Still Need Help?</h3>
        <p>Can't find the answer you're looking for?</p>
        <div className="support-options">
          <a href="mailto:support@africajustice.org" className="support-btn email">
            📧 Email Support
          </a>
          <a href="#chat" className="support-btn chat">
            💬 Chat with Us
          </a>
          <a href="/docs/api" className="support-btn docs">
            📖 API Documentation
          </a>
        </div>
      </div>
    </div>
  )
}

export default HelpGuidePage

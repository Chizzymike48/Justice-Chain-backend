import { FC, useMemo, useState } from 'react'
import { X, ChevronRight, CheckCircle } from 'lucide-react'
import '../../styles/onboarding.css'

interface OnboardingStep {
  id: string
  title: string
  description: string
  element?: string // CSS selector for element to highlight
  action: string
  tips: string[]
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AfricaJustice',
    description: 'A platform to report corruption, track accountability, and strengthen your community.',
    action: 'Get Started',
    tips: ['Let us show you around', 'Takes about 5 minutes', 'You can skip anytime'],
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Track all your reports, verifications, and impact in one place.',
    element: '.jc-app-main',
    action: 'Next',
    tips: ['View your statistics', 'Quick access to features', 'See your contributions'],
  },
  {
    id: 'report',
    title: 'Report Corruption',
    description: 'Document cases of bribery, embezzlement, abuse of power, or other misconduct.',
    action: 'Next',
    tips: [
      'Be as specific as possible',
      'Attach supporting evidence',
      'Can report anonymously',
    ],
  },
  {
    id: 'livestream',
    title: 'Record Live Incidents',
    description: 'Start recording evidence in real-time with one click.',
    element: '.jc-floating-go-live',
    action: 'Next',
    tips: [
      'Pre-filled templates for common incidents',
      'Record from safe locations only',
      'Stays secure and encrypted',
    ],
  },
  {
    id: 'verify',
    title: 'Verify Claims',
    description: 'Help strengthen community reports by verifying facts in your area.',
    action: 'Next',
    tips: [
      'Use your local knowledge',
      'Contributes to accountability',
      'Your identity is protected',
    ],
  },
  {
    id: 'projects',
    title: 'Track Projects',
    description: 'Monitor public projects to hold government accountable for promises.',
    action: 'Next',
    tips: ['Create or follow projects', 'Add milestone updates', 'Transparent tracking'],
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description:
      'You\'re ready to start reporting and making a difference. Visit the Help section anytime for detailed guidance.',
    action: 'Start Using App',
    tips: [
      '📚 Help Guide available anytime',
      '💬 Contact support if needed',
      '🎯 Every report makes a difference',
    ],
  },
]

interface OnboardingProps {
  isFirstVisit: boolean
  onComplete: () => void
}

export const OnboardingTutorial: FC<OnboardingProps> = ({ isFirstVisit, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(isFirstVisit)
  const highlightElement = useMemo(() => {
    if (!isVisible) return null
    const step = onboardingSteps[currentStep]
    if (!step.element || typeof document === 'undefined') return null
    return document.querySelector(step.element)
  }, [currentStep, isVisible])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsVisible(false)
    onComplete()
    localStorage.setItem('onboarding-completed', 'true')
  }

  if (!isVisible) return null

  const step = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1

  return (
    <>
      {/* Overlay */}
      {highlightElement && <div className="onboarding-overlay" />}

      {/* Tutorial Box */}
      <div className={`onboarding-container ${highlightElement ? 'has-highlight' : 'centered'}`}>
        {highlightElement && (
          <div className="onboarding-spotlight">
            {/* Spotlight is created with CSS */}
          </div>
        )}

        <div className={`onboarding-card step-${step.id}`}>
          {/* Header */}
          <div className="onboarding-header">
            <div className="onboarding-progress">
              <span className="progress-text">
                {currentStep + 1} of {onboardingSteps.length}
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                />
              </div>
            </div>
            <button className="onboarding-close" onClick={handleSkip} aria-label="Close tutorial">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="onboarding-content">
            <h2>{step.title}</h2>
            <p>{step.description}</p>

            {/* Tips */}
            <div className="onboarding-tips">
              {step.tips.map((tip, i) => (
                <div key={i} className="onboarding-tip">
                  <CheckCircle size={16} />
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="onboarding-actions">
            <button className="btn-secondary" onClick={handleSkip}>
              Skip Tour
            </button>
            <button className="btn-primary" onClick={handleNext}>
              {step.action}
              {!isLastStep && <ChevronRight size={18} />}
            </button>
          </div>

          {/* Step Indicators */}
          <div className="onboarding-dots">
            {onboardingSteps.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingTutorial

import React, { Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import ProtectedRoute from './pages/ProtectedRoute'
import Home from './pages/Home'
import ReportCorruptionPage from './pages/ReportCorruptionPage'
import ReportIssue from './pages/ReportIssue'
import VerificationPage from './pages/VerificationPage'
import OfficialsPage from './pages/OfficialsPage'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import LiveStreamsPage from './pages/LiveStreamsPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Navbar from './components/common/Navbar'
import AnalyticsPage from './pages/AnalyticsPage'
import TrackProjectPage from './pages/TrackProjectPage'
import EvidenceUpload from './components/corruption/EvidenceUpload'
import PetitionsPollsPage from './components/civic/PetitionCard'
import AdminDashboard from './pages/AdminDashboard'
import ReportModerationPage from './pages/ReportModerationPage'
import VerificationReviewPage from './pages/VerificationReviewPage'
import EvidenceReviewPage from './pages/EvidenceReviewPage'
import UserManagementPage from './pages/UserManagementPage'
import FloatingGoLiveButton from './components/livestream/FloatingGoLiveButton'
import HelpGuidePage from './pages/HelpGuidePage'
import OnboardingTutorial from './components/common/OnboardingTutorial'
import ChatbotWidget from './components/chatbot/ChatbotWidget'
import ChatbotPage from './components/chatbot/ChatbotPage'

const AIEvidenceAnalysis = React.lazy(() => import('./components/corruption/AIEvidenceAnalysis'))

const NavbarShell: React.FC = () => {
  const location = useLocation()
  return <Navbar key={location.pathname} />
}

// DEPLOYMENT v1.1.0: All 9 languages (EN, FR, ES, SW, PT, AM, HA, YO, IG)
function App(): React.ReactElement {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false
    const onboardingCompleted = localStorage.getItem('onboarding-completed')
    const isFirstVisit = !localStorage.getItem('user-first-login-date')

    if (isFirstVisit && !onboardingCompleted) {
      localStorage.setItem('user-first-login-date', new Date().toISOString())
      return true
    }

    return false
  })

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <div className="App">
            <OnboardingTutorial isFirstVisit={showOnboarding} onComplete={handleOnboardingComplete} />
            <a href="#main-content" className="jc-skip-link">
              Skip to main content
            </a>
            <NavbarShell />
          <main id="main-content" className="jc-app-main">
            <Routes>
              {/* Public Routes - Only Home, Login and Signup */}
              <Route path="/" element={<Home />} />
              <Route path="/livestreams" element={<LiveStreamsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/help" element={<HelpGuidePage />} />

              {/* Protected Routes - All features require login */}
              <Route
                path="/report-corruption"
                element={
                  <ProtectedRoute>
                    <ReportCorruptionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify"
                element={
                  <ProtectedRoute>
                    <VerificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-issue"
                element={
                  <ProtectedRoute>
                    <ReportIssue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officials"
                element={
                  <ProtectedRoute>
                    <OfficialsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track-projects"
                element={
                  <ProtectedRoute>
                    <TrackProjectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/petitions"
                element={
                  <ProtectedRoute>
                    <PetitionsPollsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-analysis"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<div className="p-8 text-center">Loading AI Analysis...</div>}>
                      <AIEvidenceAnalysis />
                    </Suspense>
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes (requires login) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evidence-upload"
                element={
                  <ProtectedRoute>
                    <EvidenceUpload />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute>
                    <ReportModerationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verifications"
                element={
                  <ProtectedRoute>
                    <VerificationReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/evidence"
                element={
                  <ProtectedRoute>
                    <EvidenceReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatbotPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <FloatingGoLiveButton />
          <ChatbotWidget />
        </div>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from './i18n/useI18n'
import { AppLayout } from './layout/AppLayout'

// Pages
import HomePage from './pages/HomePage'
import OnboardingPage from './onboarding/OnboardingPage'
import InsurancePage from './pages/InsurancePage'
import FindCarePage from './pages/FindCarePage'
import MedicationsPage from './pages/MedicationsPage'
import ClaimsPage from './pages/ClaimsPage'
import DocumentsPage from './pages/DocumentsPage'
import PmjayPage from './pages/PmjayPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<OnboardingPage />} />
              <Route path="dashboard" element={<HomePage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="insurance" element={<InsurancePage />} />
              <Route path="find-care" element={<FindCarePage />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="pmjay" element={<PmjayPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}

export default App

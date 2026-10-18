import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingProvider, useOnboarding } from './OnboardingProvider'
import { QuestionCard } from './components/QuestionCard'
import { OnboardingComplete } from './components/OnboardingComplete'
import { WelcomeScreen } from './components/WelcomeScreen'

const OnboardingFlow: React.FC = () => {
  const { state } = useOnboarding()
  const navigate = useNavigate()

  // Welcome state: show welcome first unless user has already progressed into questionnaire
  const hasExistingAnswers = Object.keys(state.answers).length > 0 || state.history.length > 0
  const [showWelcome, setShowWelcome] = useState<boolean>(!hasExistingAnswers && !state.isComplete)

  if (state.isComplete) {
    return <OnboardingComplete />
  }

  if (showWelcome) {
    return (
      <WelcomeScreen
        onGetStarted={() => setShowWelcome(false)}
        onAlreadyHaveAccount={() => navigate('/login')}
      />
    )
  }

  return <QuestionCard />
}

export const OnboardingPage: React.FC = () => {
  return (
    <OnboardingProvider>
      <div className="min-h-[85vh] flex items-center justify-center py-6">
        <OnboardingFlow />
      </div>
    </OnboardingProvider>
  )
}

export default OnboardingPage

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { OnboardingAction, OnboardingAnswers, OnboardingState, Question, QuestionId } from './types'
import { onboardingReducer, initialOnboardingState } from './reducer'
import { QUESTIONS, INITIAL_QUESTION_ID } from './questions'
import { useI18n } from '../i18n/useI18n'

const STORAGE_KEY = 'healthconnect_onboarding_state_v1'
const STORAGE_VERSION = 1

interface StoredPayload {
  version: number
  state: OnboardingState
}

export interface OnboardingContextValue {
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
  currentQuestionDef: Question
  answerQuestion: (questionId: QuestionId, value: string | string[]) => void
  goBack: () => void
  skipQuestion: () => void
  clearAnswers: () => void
  restoreAnswers: (answers: OnboardingAnswers, history: QuestionId[]) => void
  canGoBack: boolean
  canSkip: boolean
  progressPercentage: number
  currentStepNumber: number
  totalSteps: number
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function loadInitialState(): OnboardingState {
  try {
    if (typeof window === 'undefined') return initialOnboardingState
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return initialOnboardingState

    const parsed: unknown = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      (parsed as StoredPayload).version === STORAGE_VERSION &&
      'state' in parsed
    ) {
      const stored = (parsed as StoredPayload).state
      if (stored && stored.currentQuestion in QUESTIONS) {
        return stored
      }
    }
  } catch {
    // If corrupted or inaccessible, fallback to fresh state
  }
  return initialOnboardingState
}

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, undefined, loadInitialState)
  const { setLanguage } = useI18n()

  // Save to sessionStorage whenever state changes (no backend network calls ever)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const payload: StoredPayload = {
          version: STORAGE_VERSION,
          state,
        }
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      }
    } catch {
      // sessionStorage might be restricted (e.g. private mode in some browsers)
    }
  }, [state])

  // Sync i18n language if user changes language in the questionnaire
  useEffect(() => {
    const lang = state.answers['LANGUAGE_SELECT']
    if (lang === 'en' || lang === 'hi' || lang === 'mr') {
      setLanguage(lang)
    }
  }, [state.answers, setLanguage])

  const answerQuestion = (questionId: QuestionId, value: string | string[]) => {
    dispatch({ type: 'ANSWER', questionId, value })
  }

  const goBack = () => {
    dispatch({ type: 'NAVIGATE_BACK' })
  }

  const skipQuestion = () => {
    dispatch({ type: 'SKIP_QUESTION' })
  }

  const clearAnswers = () => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
    dispatch({ type: 'CLEAR_ALL' })
  }

  const restoreAnswers = (answers: OnboardingAnswers, history: QuestionId[]) => {
    dispatch({ type: 'RESTORE', answers, history })
  }

  const currentQuestionDef: Question = QUESTIONS[state.currentQuestion] ?? QUESTIONS[INITIAL_QUESTION_ID]
  const canGoBack = state.history.length > 0 && !state.isComplete
  const canSkip = currentQuestionDef.optional && !state.isComplete

  // Streamlined 10-step concise questionnaire flow
  const totalEstimatedSteps = 10
  const currentStepNumber = Math.min(state.history.length + 1, totalEstimatedSteps)
  const progressPercentage = state.isComplete
    ? 100
    : Math.round((currentStepNumber / totalEstimatedSteps) * 100)

  return (
    <OnboardingContext.Provider
      value={{
        state,
        dispatch,
        currentQuestionDef,
        answerQuestion,
        goBack,
        skipQuestion,
        clearAnswers,
        restoreAnswers,
        canGoBack,
        canSkip,
        progressPercentage,
        currentStepNumber,
        totalSteps: totalEstimatedSteps,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

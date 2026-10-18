import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingProvider, useOnboarding } from '../../onboarding/OnboardingProvider'
import { I18nProvider } from '../../i18n/useI18n'

const STORAGE_KEY = 'healthconnect_onboarding_state_v1'

const TestHarness: React.FC = () => {
  const {
    state,
    answerQuestion,
    clearAnswers,
    goBack,
    skipQuestion,
    canGoBack,
    canSkip,
  } = useOnboarding()

  return (
    <div>
      <div data-testid="current-q">{state.currentQuestion}</div>
      <div data-testid="answers-json">{JSON.stringify(state.answers)}</div>
      <div data-testid="can-back">{canGoBack ? 'true' : 'false'}</div>
      <div data-testid="can-skip">{canSkip ? 'true' : 'false'}</div>

      <button
        type="button"
        data-testid="answer-lang"
        onClick={() => answerQuestion('LANGUAGE_SELECT', 'en')}
      >
        Answer Lang
      </button>

      <button
        type="button"
        data-testid="answer-owner"
        onClick={() => answerQuestion('PROFILE_OWNER', 'Myself')}
      >
        Answer Owner Myself
      </button>

      <button type="button" data-testid="go-back" onClick={goBack}>
        Back
      </button>

      <button type="button" data-testid="skip-btn" onClick={skipQuestion}>
        Skip
      </button>

      <button type="button" data-testid="clear-btn" onClick={clearAnswers}>
        Clear
      </button>
    </div>
  )
}

describe('OnboardingProvider', () => {
  beforeEach(() => {
    window.sessionStorage?.clear?.()
    window.localStorage?.clear?.()
    vi.restoreAllMocks()
  })

  it('persists answers to sessionStorage on answer', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <OnboardingProvider>
          <TestHarness />
        </OnboardingProvider>
      </I18nProvider>
    )

    expect(screen.getByTestId('current-q')).toHaveTextContent('LANGUAGE_SELECT')

    await user.click(screen.getByTestId('answer-lang'))

    // Should have advanced to PROFILE_OWNER
    expect(screen.getByTestId('current-q')).toHaveTextContent('PROFILE_OWNER')

    // Check sessionStorage
    const storedRaw = window.sessionStorage.getItem(STORAGE_KEY)
    expect(storedRaw).not.toBeNull()
    const stored = JSON.parse(storedRaw!)
    expect(stored.version).toBe(1)
    expect(stored.state.answers['LANGUAGE_SELECT']).toBe('en')
    expect(stored.state.currentQuestion).toBe('PROFILE_OWNER')
  })

  it('restores state from sessionStorage on mount', () => {
    const preSavedPayload = {
      version: 1,
      state: {
        currentQuestion: 'LOCATION_STATE',
        answers: {
          LANGUAGE_SELECT: 'en',
          PROFILE_OWNER: 'Myself',
          AGE_GROUP: '31-45',
        },
        history: ['LANGUAGE_SELECT', 'PROFILE_OWNER', 'AGE_GROUP', 'AGE_EXACT', 'GENDER'],
        isComplete: false,
      },
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preSavedPayload))

    render(
      <I18nProvider>
        <OnboardingProvider>
          <TestHarness />
        </OnboardingProvider>
      </I18nProvider>
    )

    expect(screen.getByTestId('current-q')).toHaveTextContent('LOCATION_STATE')
    expect(screen.getByTestId('can-back')).toHaveTextContent('true')
  })

  it('clears sessionStorage and resets state on clearAnswers', async () => {
    const user = userEvent.setup()

    render(
      <I18nProvider>
        <OnboardingProvider>
          <TestHarness />
        </OnboardingProvider>
      </I18nProvider>
    )

    await user.click(screen.getByTestId('answer-lang'))
    expect(window.sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()

    await user.click(screen.getByTestId('clear-btn'))

    expect(screen.getByTestId('current-q')).toHaveTextContent('LANGUAGE_SELECT')
    expect(screen.getByTestId('answers-json')).toHaveTextContent('{}')
  })

  it('gracefully discards corrupted sessionStorage content', () => {
    window.sessionStorage.setItem(STORAGE_KEY, 'corrupted_json{{{')

    render(
      <I18nProvider>
        <OnboardingProvider>
          <TestHarness />
        </OnboardingProvider>
      </I18nProvider>
    )

    expect(screen.getByTestId('current-q')).toHaveTextContent('LANGUAGE_SELECT')
    expect(screen.getByTestId('answers-json')).toHaveTextContent('{}')
  })
})

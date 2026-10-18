import { describe, it, expect } from 'vitest'
import { onboardingReducer, initialOnboardingState } from '../../onboarding/reducer'
import type { OnboardingState } from '../../onboarding/types'

describe('onboardingReducer', () => {
  it('starts at initial state with LANGUAGE_SELECT', () => {
    expect(initialOnboardingState.currentQuestion).toBe('LANGUAGE_SELECT')
    expect(initialOnboardingState.answers).toEqual({})
    expect(initialOnboardingState.history).toEqual([])
    expect(initialOnboardingState.isComplete).toBe(false)
  })

  it('advances directly from PROFILE_OWNER to AGE_GROUP', () => {
    const s1 = onboardingReducer(initialOnboardingState, {
      type: 'ANSWER',
      questionId: 'LANGUAGE_SELECT',
      value: 'en',
    })
    expect(s1.currentQuestion).toBe('PROFILE_OWNER')

    const s2 = onboardingReducer(s1, {
      type: 'ANSWER',
      questionId: 'PROFILE_OWNER',
      value: 'Child',
    })
    expect(s2.currentQuestion).toBe('AGE_GROUP')
    expect(s2.history).toEqual(['LANGUAGE_SELECT', 'PROFILE_OWNER'])
  })

  it('branches directly to AGE_GROUP when PROFILE_OWNER is Myself', () => {
    const s1 = onboardingReducer(initialOnboardingState, {
      type: 'ANSWER',
      questionId: 'LANGUAGE_SELECT',
      value: 'en',
    })

    const s2 = onboardingReducer(s1, {
      type: 'ANSWER',
      questionId: 'PROFILE_OWNER',
      value: 'Myself',
    })
    expect(s2.currentQuestion).toBe('AGE_GROUP')
    expect(s2.history).toEqual(['LANGUAGE_SELECT', 'PROFILE_OWNER'])
  })

  it('advances from PMJAY_CARD directly to OTHER_INSURANCE', () => {
    const state: OnboardingState = {
      currentQuestion: 'PMJAY_CARD',
      answers: {},
      history: ['HOUSEHOLD_SIZE'],
      isComplete: false,
    }

    const next = onboardingReducer(state, {
      type: 'ANSWER',
      questionId: 'PMJAY_CARD',
      value: 'Yes, I have a PM-JAY / Ayushman Bharat card',
    })

    expect(next.currentQuestion).toBe('OTHER_INSURANCE')
  })

  it('advances from OTHER_INSURANCE directly to HEALTH_CONDITIONS', () => {
    const state: OnboardingState = {
      currentQuestion: 'OTHER_INSURANCE',
      answers: {},
      history: ['PMJAY_CARD'],
      isComplete: false,
    }

    const next = onboardingReducer(state, {
      type: 'ANSWER',
      questionId: 'OTHER_INSURANCE',
      value: 'Yes',
    })

    expect(next.currentQuestion).toBe('HEALTH_CONDITIONS')
  })

  it('advances from HEALTH_CONDITIONS directly to HEALTHCARE_PRIORITIES', () => {
    const state: OnboardingState = {
      currentQuestion: 'HEALTH_CONDITIONS',
      answers: {},
      history: ['OTHER_INSURANCE'],
      isComplete: false,
    }

    const afterConditions = onboardingReducer(state, {
      type: 'ANSWER',
      questionId: 'HEALTH_CONDITIONS',
      value: ['Diabetes / high blood sugar', 'Heart disease or heart attack history'],
    })

    expect(afterConditions.currentQuestion).toBe('HEALTHCARE_PRIORITIES')
  })

  it('skips condition followups and goes to HEALTHCARE_PRIORITIES when None of the above is selected', () => {
    const state: OnboardingState = {
      currentQuestion: 'HEALTH_CONDITIONS',
      answers: {},
      history: ['OTHER_INSURANCE'],
      isComplete: false,
    }

    const next = onboardingReducer(state, {
      type: 'ANSWER',
      questionId: 'HEALTH_CONDITIONS',
      value: ['None of the above'],
    })

    expect(next.currentQuestion).toBe('HEALTHCARE_PRIORITIES')
  })

  it('handles back navigation and restores dormant answers', () => {
    // Navigate A -> B -> C
    const s0 = initialOnboardingState
    const s1 = onboardingReducer(s0, {
      type: 'ANSWER',
      questionId: 'LANGUAGE_SELECT',
      value: 'en',
    })
    const s2 = onboardingReducer(s1, {
      type: 'ANSWER',
      questionId: 'PROFILE_OWNER',
      value: 'Myself',
    })
    const s3 = onboardingReducer(s2, {
      type: 'ANSWER',
      questionId: 'AGE_GROUP',
      value: '31-45',
    })

    expect(s3.currentQuestion).toBe('GENDER')
    expect(s3.answers['AGE_GROUP']).toBe('31-45')

    // Navigate back to AGE_GROUP
    const sBack = onboardingReducer(s3, { type: 'NAVIGATE_BACK' })
    expect(sBack.currentQuestion).toBe('AGE_GROUP')
    expect(sBack.history).toEqual(['LANGUAGE_SELECT', 'PROFILE_OWNER'])

    // The answer at AGE_GROUP is still preserved (dormant restoration)
    expect(sBack.answers['AGE_GROUP']).toBe('31-45')

    // Navigate back again to PROFILE_OWNER
    const sBack2 = onboardingReducer(sBack, { type: 'NAVIGATE_BACK' })
    expect(sBack2.currentQuestion).toBe('PROFILE_OWNER')
    expect(sBack2.answers['PROFILE_OWNER']).toBe('Myself')
  })

  it('allows skipping optional questions but refuses skipping required ones', () => {
    // AGE_EXACT is optional
    const stateOptional: OnboardingState = {
      currentQuestion: 'AGE_EXACT',
      answers: {},
      history: ['AGE_GROUP'],
      isComplete: false,
    }

    const afterSkip = onboardingReducer(stateOptional, { type: 'SKIP_QUESTION' })
    expect(afterSkip.currentQuestion).toBe('GENDER')
    expect(afterSkip.history).toEqual(['AGE_GROUP', 'AGE_EXACT'])

    // PROFILE_OWNER is required
    const stateRequired: OnboardingState = {
      currentQuestion: 'PROFILE_OWNER',
      answers: {},
      history: ['LANGUAGE_SELECT'],
      isComplete: false,
    }

    const afterAttemptSkip = onboardingReducer(stateRequired, { type: 'SKIP_QUESTION' })
    // Must remain on PROFILE_OWNER
    expect(afterAttemptSkip.currentQuestion).toBe('PROFILE_OWNER')
  })

  it('clears all answers on CLEAR_ALL', () => {
    const dirtyState: OnboardingState = {
      currentQuestion: 'MEDICATIONS',
      answers: {
        LANGUAGE_SELECT: 'hi',
        PROFILE_OWNER: 'Child',
        RELATIONSHIP: 'Son',
      },
      history: ['LANGUAGE_SELECT', 'PROFILE_OWNER', 'RELATIONSHIP'],
      isComplete: false,
    }

    const cleared = onboardingReducer(dirtyState, { type: 'CLEAR_ALL' })
    expect(cleared.currentQuestion).toBe('LANGUAGE_SELECT')
    expect(cleared.answers).toEqual({})
    expect(cleared.history).toEqual([])
    expect(cleared.isComplete).toBe(false)
  })

  it('completes the questionnaire when HEALTHCARE_PRIORITIES is answered', () => {
    const prioritiesState: OnboardingState = {
      currentQuestion: 'HEALTHCARE_PRIORITIES',
      answers: {
        LANGUAGE_SELECT: 'en',
      },
      history: ['HEALTH_CONDITIONS'],
      isComplete: false,
    }

    const completed = onboardingReducer(prioritiesState, {
      type: 'ANSWER',
      questionId: 'HEALTHCARE_PRIORITIES',
      value: ['Finding nearby hospitals and doctors'],
    })

    expect(completed.isComplete).toBe(true)
  })

  it('stores extraAnswers atomically on ANSWER', () => {
    const state: OnboardingState = {
      currentQuestion: 'LOCATION_STATE',
      answers: {},
      history: ['GENDER'],
      isComplete: false,
    }

    const next = onboardingReducer(state, {
      type: 'ANSWER',
      questionId: 'LOCATION_STATE',
      value: 'Delhi',
      extraAnswers: {
        LOCATION_DISTRICT: 'South West Delhi',
      },
    })

    expect(next.currentQuestion).toBe('HOUSEHOLD_SIZE')
    expect(next.answers['LOCATION_STATE']).toBe('Delhi')
    expect(next.answers['LOCATION_DISTRICT']).toBe('South West Delhi')
  })

  it('updates an answer with SET_ANSWER without navigating or pushing history', () => {
    const state: OnboardingState = {
      currentQuestion: 'LOCATION_STATE',
      answers: {
        LOCATION_STATE: 'Maharashtra',
      },
      history: ['GENDER'],
      isComplete: false,
    }

    const updated = onboardingReducer(state, {
      type: 'SET_ANSWER',
      questionId: 'LOCATION_DISTRICT',
      value: 'Pune',
    })

    expect(updated.currentQuestion).toBe('LOCATION_STATE')
    expect(updated.history).toEqual(['GENDER'])
    expect(updated.answers['LOCATION_DISTRICT']).toBe('Pune')
    expect(updated.answers['LOCATION_STATE']).toBe('Maharashtra')
  })
})

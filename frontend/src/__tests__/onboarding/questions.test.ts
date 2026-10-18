import { describe, it, expect } from 'vitest'
import { QUESTIONS, conditionToFollowupMap, getNextFollowupQuestion } from '../../onboarding/questions'
import type { QuestionId } from '../../onboarding/types'

const ALL_QUESTION_IDS: QuestionId[] = [
  'LANGUAGE_SELECT',
  'PROFILE_OWNER',
  'RELATIONSHIP',
  'AGE_GROUP',
  'AGE_EXACT',
  'GENDER',
  'LOCATION_STATE',
  'LOCATION_DISTRICT',
  'HOUSEHOLD_SIZE',
  'INCOME_BAND',
  'WHO_NEEDS_SUPPORT',
  'FAMILY_HISTORY',
  'PMJAY_CARD',
  'PMJAY_CARD_NUMBER_SKIP',
  'OTHER_INSURANCE',
  'INSURANCE_TYPE',
  'TREATMENT_BUDGET',
  'HEALTHCARE_PRIORITIES',
  'HEALTH_CONDITIONS',
  'CONDITION_FOLLOWUP_DIABETES',
  'CONDITION_FOLLOWUP_HYPERTENSION',
  'CONDITION_FOLLOWUP_HEART',
  'CONDITION_FOLLOWUP_CANCER',
  'CONDITION_FOLLOWUP_RESPIRATORY',
  'CONDITION_FOLLOWUP_KIDNEY',
  'LIFESTYLE_ACTIVITY',
  'LIFESTYLE_DIET',
  'MEDICATIONS',
  'DOCUMENTS',
  'REVIEW',
]

describe('Onboarding Questions Definition & Branching Completeness', () => {
  it('defines every QuestionId in the QUESTIONS registry', () => {
    ALL_QUESTION_IDS.forEach((id) => {
      expect(QUESTIONS[id], `Question definition missing for id: ${id}`).toBeDefined()
      expect(QUESTIONS[id].id).toBe(id)
      expect(typeof QUESTIONS[id].titleKey).toBe('string')
      expect(typeof QUESTIONS[id].nextQuestion).toBe('function')
    })
  })

  it('ensures review question terminates questionnaire with null', () => {
    const reviewDef = QUESTIONS['REVIEW']
    expect(reviewDef.nextQuestion({})).toBeNull()
  })

  it('ensures all non-terminal nextQuestion calls return valid QuestionIds', () => {
    ALL_QUESTION_IDS.filter((id) => id !== 'REVIEW').forEach((id) => {
      const q = QUESTIONS[id]
      const next = q.nextQuestion({})
      if (next !== null) {
        expect(
          ALL_QUESTION_IDS.includes(next),
          `Question ${id} returned unknown next question id: ${next}`
        ).toBe(true)
      }
    })
  })

  it('correctly maps all condition followups in conditionToFollowupMap', () => {
    expect(conditionToFollowupMap.length).toBe(6)

    const expectedFollowupIds: QuestionId[] = [
      'CONDITION_FOLLOWUP_DIABETES',
      'CONDITION_FOLLOWUP_HYPERTENSION',
      'CONDITION_FOLLOWUP_HEART',
      'CONDITION_FOLLOWUP_CANCER',
      'CONDITION_FOLLOWUP_RESPIRATORY',
      'CONDITION_FOLLOWUP_KIDNEY',
    ]

    expectedFollowupIds.forEach((fId) => {
      expect(QUESTIONS[fId]).toBeDefined()
      expect(conditionToFollowupMap.some((c) => c.followup === fId)).toBe(true)
    })
  })

  it('advances through all selected followups and ends at LIFESTYLE_ACTIVITY', () => {
    const allSix = conditionToFollowupMap.map((c) => c.condition)
    const answers = { HEALTH_CONDITIONS: allSix }

    let current = getNextFollowupQuestion(answers, -1)
    expect(current).toBe('CONDITION_FOLLOWUP_DIABETES')

    current = getNextFollowupQuestion(answers, 0)
    expect(current).toBe('CONDITION_FOLLOWUP_HYPERTENSION')

    current = getNextFollowupQuestion(answers, 1)
    expect(current).toBe('CONDITION_FOLLOWUP_HEART')

    current = getNextFollowupQuestion(answers, 2)
    expect(current).toBe('CONDITION_FOLLOWUP_CANCER')

    current = getNextFollowupQuestion(answers, 3)
    expect(current).toBe('CONDITION_FOLLOWUP_RESPIRATORY')

    current = getNextFollowupQuestion(answers, 4)
    expect(current).toBe('CONDITION_FOLLOWUP_KIDNEY')

    current = getNextFollowupQuestion(answers, 5)
    expect(current).toBe('LIFESTYLE_ACTIVITY')
  })
})

export type QuestionId =
  | 'LANGUAGE_SELECT'
  | 'PROFILE_OWNER'
  | 'RELATIONSHIP'
  | 'AGE_GROUP'
  | 'AGE_EXACT'
  | 'GENDER'
  | 'LOCATION_STATE'
  | 'LOCATION_DISTRICT'
  | 'HOUSEHOLD_SIZE'
  | 'INCOME_BAND'
  | 'WHO_NEEDS_SUPPORT'
  | 'FAMILY_HISTORY'
  | 'PMJAY_CARD'
  | 'PMJAY_CARD_NUMBER_SKIP'
  | 'OTHER_INSURANCE'
  | 'INSURANCE_TYPE'
  | 'TREATMENT_BUDGET'
  | 'HEALTHCARE_PRIORITIES'
  | 'HEALTH_CONDITIONS'
  | 'CONDITION_FOLLOWUP_DIABETES'
  | 'CONDITION_FOLLOWUP_HYPERTENSION'
  | 'CONDITION_FOLLOWUP_HEART'
  | 'CONDITION_FOLLOWUP_CANCER'
  | 'CONDITION_FOLLOWUP_RESPIRATORY'
  | 'CONDITION_FOLLOWUP_KIDNEY'
  | 'LIFESTYLE_ACTIVITY'
  | 'LIFESTYLE_DIET'
  | 'MEDICATIONS'
  | 'DOCUMENTS'
  | 'REVIEW'

export type SelectionMode = 'single' | 'multi'

export interface QuestionOption {
  value: string
  labelKey: string
  descriptionKey?: string | undefined
  exclusive?: boolean | undefined // e.g. for "None of the above" or "Prefer not to say"
  icon?: string | undefined // friendly emoji or icon indicator
}

export type QuestionInputType =
  | 'single_select'
  | 'multi_select'
  | 'text'
  | 'number'
  | 'state_dropdown'
  | 'state_district'
  | 'review'

export interface Question {
  id: QuestionId
  optional: boolean
  selectionMode?: SelectionMode | undefined
  inputType: QuestionInputType
  titleKey: string
  descKey?: string | undefined
  disclaimerKey?: string | undefined
  options?: QuestionOption[] | undefined
  nextQuestion: (answers: OnboardingAnswers) => QuestionId | null
  stepBadge?: string | undefined
  whyWeAskKey?: string | undefined
}

export interface OnboardingAnswers {
  [questionId: string]: string | string[] | undefined
}

export type OnboardingAction =
  | { type: 'ANSWER'; questionId: QuestionId; value: string | string[] }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'SKIP_QUESTION' }
  | { type: 'CLEAR_ALL' }
  | { type: 'RESTORE'; answers: OnboardingAnswers; history: QuestionId[] }

export interface OnboardingState {
  currentQuestion: QuestionId
  answers: OnboardingAnswers
  history: QuestionId[]
  isComplete: boolean
}

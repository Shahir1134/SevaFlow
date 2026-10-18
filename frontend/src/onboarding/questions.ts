import type { Question, QuestionId, OnboardingAnswers } from './types'

export const conditionToFollowupMap: Array<{ condition: string; followup: QuestionId }> = [
  { condition: 'Diabetes / high blood sugar', followup: 'CONDITION_FOLLOWUP_DIABETES' },
  { condition: 'High blood pressure (hypertension)', followup: 'CONDITION_FOLLOWUP_HYPERTENSION' },
  { condition: 'Heart disease or heart attack history', followup: 'CONDITION_FOLLOWUP_HEART' },
  { condition: 'Cancer (current or in treatment)', followup: 'CONDITION_FOLLOWUP_CANCER' },
  { condition: 'Respiratory condition (asthma, COPD)', followup: 'CONDITION_FOLLOWUP_RESPIRATORY' },
  { condition: 'Chronic kidney disease', followup: 'CONDITION_FOLLOWUP_KIDNEY' },
]

export function getNextFollowupQuestion(
  answers: OnboardingAnswers,
  currentFollowupIndex: number
): QuestionId {
  const selectedConditionsRaw = answers['HEALTH_CONDITIONS']
  const selectedConditions: string[] = Array.isArray(selectedConditionsRaw)
    ? selectedConditionsRaw
    : typeof selectedConditionsRaw === 'string'
      ? [selectedConditionsRaw]
      : []

  for (let i = currentFollowupIndex + 1; i < conditionToFollowupMap.length; i++) {
    const item = conditionToFollowupMap[i]
    if (item && selectedConditions.includes(item.condition)) {
      return item.followup
    }
  }

  return 'LIFESTYLE_ACTIVITY'
}

export const QUESTIONS: Record<QuestionId, Question> = {
  // Question 1: Preferred language
  LANGUAGE_SELECT: {
    id: 'LANGUAGE_SELECT',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_LANGUAGE_SELECT_title',
    descKey: 'q_LANGUAGE_SELECT_desc',
    stepBadge: 'Language Preference',
    whyWeAskKey: 'Choose your preferred language for the whole platform.',
    options: [
      { value: 'en', labelKey: 'English' },
      { value: 'hi', labelKey: 'हिंदी (Hindi)' },
      { value: 'mr', labelKey: 'मराठी (Marathi)' },
    ],
    nextQuestion: () => 'PROFILE_OWNER',
  },

  // Question 2: Name / Profile Owner
  PROFILE_OWNER: {
    id: 'PROFILE_OWNER',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_PROFILE_OWNER_title',
    descKey: 'q_PROFILE_OWNER_desc',
    stepBadge: 'Profile Member',
    whyWeAskKey: 'We customize hospital finders and insurance analysis for this individual.',
    options: [
      { value: 'Myself', labelKey: 'opt_myself' },
      { value: 'Spouse', labelKey: 'opt_spouse' },
      { value: 'Child', labelKey: 'opt_child' },
      { value: 'Parent', labelKey: 'opt_parent' },
      { value: 'Other family member', labelKey: 'opt_other_family' },
    ],
    nextQuestion: () => 'AGE_GROUP',
  },

  RELATIONSHIP: {
    id: 'RELATIONSHIP',
    optional: false,
    inputType: 'text',
    titleKey: 'q_RELATIONSHIP_title',
    descKey: 'q_RELATIONSHIP_desc',
    nextQuestion: () => 'AGE_GROUP',
  },

  // Question 3: Age
  AGE_GROUP: {
    id: 'AGE_GROUP',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_AGE_GROUP_title',
    descKey: 'q_AGE_GROUP_desc',
    stepBadge: 'Life Stage',
    whyWeAskKey: 'Helps identify age-specific coverage and Section 80D senior tax limits.',
    options: [
      { value: 'Under 18', labelKey: 'opt_under_18' },
      { value: '18-30', labelKey: 'opt_18_30' },
      { value: '31-45', labelKey: 'opt_31_45' },
      { value: '46-60', labelKey: 'opt_46_60' },
      { value: 'Over 60', labelKey: 'opt_over_60' },
    ],
    nextQuestion: () => 'GENDER',
  },

  AGE_EXACT: {
    id: 'AGE_EXACT',
    optional: true,
    inputType: 'number',
    titleKey: 'q_AGE_EXACT_title',
    descKey: 'q_AGE_EXACT_desc',
    nextQuestion: () => 'GENDER',
  },

  // Question 4: Gender
  GENDER: {
    id: 'GENDER',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_GENDER_title',
    descKey: 'q_GENDER_desc',
    stepBadge: 'Identity',
    whyWeAskKey: 'Helps personalize clinical care recommendations and wellness programs.',
    options: [
      { value: 'Male', labelKey: 'opt_gender_male' },
      { value: 'Female', labelKey: 'opt_gender_female' },
      { value: 'Other', labelKey: 'opt_gender_other' },
      { value: 'Prefer not to say', labelKey: 'opt_gender_prefer_not' },
    ],
    nextQuestion: () => 'LOCATION_STATE',
  },

  // Question 5: Location (State + District)
  LOCATION_STATE: {
    id: 'LOCATION_STATE',
    optional: false,
    inputType: 'state_district',
    titleKey: 'q_LOCATION_STATE_title',
    descKey: 'q_LOCATION_STATE_desc',
    stepBadge: 'Location & District',
    whyWeAskKey: 'Used to locate verified PM-JAY empanelled hospitals within your district.',
    nextQuestion: () => 'HOUSEHOLD_SIZE',
  },

  LOCATION_DISTRICT: {
    id: 'LOCATION_DISTRICT',
    optional: true,
    inputType: 'text',
    titleKey: 'q_LOCATION_DISTRICT_title',
    descKey: 'q_LOCATION_DISTRICT_desc',
    nextQuestion: () => 'HOUSEHOLD_SIZE',
  },

  // Question 6: Household size
  HOUSEHOLD_SIZE: {
    id: 'HOUSEHOLD_SIZE',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_HOUSEHOLD_SIZE_title',
    descKey: 'q_HOUSEHOLD_SIZE_desc',
    stepBadge: 'Family Size',
    whyWeAskKey: 'Calculates family floater insurance adequacy and card limits.',
    options: [
      { value: '1 person', labelKey: 'opt_hh_1' },
      { value: '2–3 people', labelKey: 'opt_hh_2_3' },
      { value: '4–5 people', labelKey: 'opt_hh_4_5' },
      { value: '6 or more people', labelKey: 'opt_hh_6_plus' },
    ],
    nextQuestion: () => 'PMJAY_CARD',
  },

  // Question 7: Household income
  INCOME_BAND: {
    id: 'INCOME_BAND',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_INCOME_BAND_title',
    descKey: 'q_INCOME_BAND_desc',
    options: [
      { value: 'Under ₹10,000', labelKey: 'opt_income_under_10k' },
      { value: '₹10,000–₹25,000', labelKey: 'opt_income_10k_25k' },
      { value: '₹25,000–₹50,000', labelKey: 'opt_income_25k_50k' },
      { value: '₹50,000–₹1,00,000', labelKey: 'opt_income_50k_100k' },
      { value: 'Above ₹1,00,000', labelKey: 'opt_income_above_100k' },
      { value: 'Prefer not to say', labelKey: 'opt_income_prefer_not' },
      { value: "I'm not sure", labelKey: 'opt_income_not_sure' },
    ],
    nextQuestion: () => 'WHO_NEEDS_SUPPORT',
  },

  // Question 8: Who needs healthcare support?
  WHO_NEEDS_SUPPORT: {
    id: 'WHO_NEEDS_SUPPORT',
    optional: true,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_WHO_NEEDS_SUPPORT_title',
    descKey: 'q_WHO_NEEDS_SUPPORT_desc',
    options: [
      { value: 'Just myself', labelKey: 'opt_who_myself' },
      { value: 'My spouse or partner', labelKey: 'opt_who_spouse' },
      { value: 'My children', labelKey: 'opt_who_children' },
      { value: 'My parents or grandparents', labelKey: 'opt_who_parents' },
      { value: 'My whole family', labelKey: 'opt_who_family' },
      { value: 'Someone I care for', labelKey: 'opt_who_someone_else' },
    ],
    nextQuestion: () => 'FAMILY_HISTORY',
  },

  // Question 9: Family health history
  FAMILY_HISTORY: {
    id: 'FAMILY_HISTORY',
    optional: true,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_FAMILY_HISTORY_title',
    descKey: 'q_FAMILY_HISTORY_desc',
    disclaimerKey: 'familyHistoryDisclaimer',
    options: [
      { value: 'None known', labelKey: 'opt_fam_none', exclusive: true },
      { value: 'Diabetes', labelKey: 'opt_fam_diabetes' },
      { value: 'Heart disease', labelKey: 'opt_fam_heart' },
      { value: 'High blood pressure', labelKey: 'opt_fam_hypertension' },
      { value: 'Stroke', labelKey: 'opt_fam_stroke' },
      { value: 'Kidney disease', labelKey: 'opt_fam_kidney' },
      { value: 'Cancer', labelKey: 'opt_fam_cancer' },
      { value: 'Other', labelKey: 'opt_fam_other' },
      { value: 'Not sure', labelKey: 'opt_not_sure', exclusive: true },
      { value: 'Prefer not to answer', labelKey: 'opt_cond_prefer_not', exclusive: true },
    ],
    nextQuestion: () => 'PMJAY_CARD',
  },

  // Question 7: Existing PM-JAY insurance
  PMJAY_CARD: {
    id: 'PMJAY_CARD',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_PMJAY_CARD_title',
    descKey: 'q_PMJAY_CARD_desc',
    disclaimerKey: 'pmjayDisclaimer',
    stepBadge: 'Ayushman Bharat',
    whyWeAskKey: 'Ayushman Bharat provides up to ₹5 lakh annual coverage per family.',
    options: [
      { value: 'Yes, I have a PM-JAY / Ayushman Bharat card', labelKey: 'opt_pmjay_yes' },
      { value: 'No', labelKey: 'opt_pmjay_no' },
      { value: 'Not sure', labelKey: 'opt_pmjay_not_sure' },
    ],
    nextQuestion: () => 'OTHER_INSURANCE',
  },

  PMJAY_CARD_NUMBER_SKIP: {
    id: 'PMJAY_CARD_NUMBER_SKIP',
    optional: true,
    inputType: 'text',
    titleKey: 'q_PMJAY_CARD_NUMBER_SKIP_title',
    descKey: 'q_PMJAY_CARD_NUMBER_SKIP_desc',
    disclaimerKey: 'pmjayDisclaimer',
    nextQuestion: () => 'OTHER_INSURANCE',
  },

  // Question 8: Other insurance
  OTHER_INSURANCE: {
    id: 'OTHER_INSURANCE',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_OTHER_INSURANCE_title',
    descKey: 'q_OTHER_INSURANCE_desc',
    stepBadge: 'Other Health Insurance',
    whyWeAskKey: 'Connect your policy to our AI document analyzer for instant claim guidance.',
    options: [
      { value: 'Yes', labelKey: 'opt_yes' },
      { value: 'No', labelKey: 'opt_no' },
      { value: 'Not sure', labelKey: 'opt_not_sure' },
    ],
    nextQuestion: () => 'HEALTH_CONDITIONS',
  },

  INSURANCE_TYPE: {
    id: 'INSURANCE_TYPE',
    optional: false,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_INSURANCE_TYPE_title',
    descKey: 'q_INSURANCE_TYPE_desc',
    options: [
      { value: 'Private health insurance', labelKey: 'opt_ins_private' },
      { value: 'Employer-provided insurance', labelKey: 'opt_ins_employer' },
      { value: 'Government health scheme', labelKey: 'opt_ins_govt' },
      { value: 'More than one type', labelKey: 'opt_ins_multiple' },
      { value: 'No insurance', labelKey: 'opt_ins_none', exclusive: true },
      { value: "I'm not sure", labelKey: 'opt_not_sure', exclusive: true },
    ],
    nextQuestion: () => 'TREATMENT_BUDGET',
  },

  // Question 11: Preferred treatment budget (legacy entry kept for test integrity)
  TREATMENT_BUDGET: {
    id: 'TREATMENT_BUDGET',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_TREATMENT_BUDGET_title',
    descKey: 'q_TREATMENT_BUDGET_desc',
    options: [
      { value: 'Under ₹5,00,000', labelKey: 'opt_budget_under_5k' },
      { value: 'Above ₹5,00,000', labelKey: 'opt_budget_above_100k' },
    ],
    nextQuestion: () => 'HEALTHCARE_PRIORITIES',
  },

  // Question 9: Personal Health Conditions
  HEALTH_CONDITIONS: {
    id: 'HEALTH_CONDITIONS',
    optional: false,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_HEALTH_CONDITIONS_title',
    descKey: 'q_HEALTH_CONDITIONS_desc',
    disclaimerKey: 'healthConditionsDisclaimer',
    stepBadge: 'Health Focus',
    whyWeAskKey: 'Used to flag pre-existing disease waiting periods and track medication schedules.',
    options: [
      { value: 'None of the above', labelKey: 'opt_cond_none', exclusive: true },
      { value: 'Diabetes / high blood sugar', labelKey: 'opt_cond_diabetes' },
      { value: 'High blood pressure (hypertension)', labelKey: 'opt_cond_hypertension' },
      { value: 'Heart disease or heart attack history', labelKey: 'opt_cond_heart' },
      { value: 'Respiratory condition (asthma, COPD)', labelKey: 'opt_cond_respiratory' },
      { value: 'Thyroid disorder', labelKey: 'opt_cond_thyroid' },
      { value: 'Other', labelKey: 'opt_cond_other' },
      { value: 'Prefer not to say', labelKey: 'opt_cond_prefer_not', exclusive: true },
    ],
    nextQuestion: () => 'HEALTHCARE_PRIORITIES',
  },

  // Question 10: Main reason for using HealthConnect India / Healthcare Priorities
  HEALTHCARE_PRIORITIES: {
    id: 'HEALTHCARE_PRIORITIES',
    optional: false,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_HEALTHCARE_PRIORITIES_title',
    descKey: 'q_HEALTHCARE_PRIORITIES_desc',
    stepBadge: 'Platform Priorities',
    whyWeAskKey: 'Personalizes your HealthConnect India dashboard to your highest priority.',
    options: [
      { value: 'Finding nearby hospitals and doctors', labelKey: 'opt_reason_find_care' },
      { value: 'Understanding insurance coverage', labelKey: 'opt_reason_insurance' },
      { value: 'Managing medicines and medical reports', labelKey: 'opt_reason_records' },
      { value: 'Finding affordable treatment', labelKey: 'opt_reason_affordability' },
      { value: 'Managing my family’s health', labelKey: 'opt_reason_family_mgmt' },
    ],
    nextQuestion: () => null,
  },

  CONDITION_FOLLOWUP_DIABETES: {
    id: 'CONDITION_FOLLOWUP_DIABETES',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_DIABETES_title',
    descKey: 'q_CONDITION_FOLLOWUP_DIABETES_desc',
    options: [
      { value: 'Managed with diet only', labelKey: 'opt_diabetes_diet' },
      { value: 'Oral medication', labelKey: 'opt_diabetes_oral' },
      { value: 'Insulin', labelKey: 'opt_diabetes_insulin' },
      { value: 'Prefer not to say', labelKey: 'opt_diabetes_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 0),
  },

  CONDITION_FOLLOWUP_HYPERTENSION: {
    id: 'CONDITION_FOLLOWUP_HYPERTENSION',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_HYPERTENSION_title',
    descKey: 'q_CONDITION_FOLLOWUP_HYPERTENSION_desc',
    options: [
      { value: 'Controlled with medication', labelKey: 'opt_htn_controlled' },
      { value: 'Uncontrolled', labelKey: 'opt_htn_uncontrolled' },
      { value: 'Newly diagnosed', labelKey: 'opt_htn_new' },
      { value: 'Prefer not to say', labelKey: 'opt_htn_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 1),
  },

  CONDITION_FOLLOWUP_HEART: {
    id: 'CONDITION_FOLLOWUP_HEART',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_HEART_title',
    descKey: 'q_CONDITION_FOLLOWUP_HEART_desc',
    options: [
      { value: 'Stable', labelKey: 'opt_heart_stable' },
      { value: 'Had procedure/surgery', labelKey: 'opt_heart_procedure_done' },
      { value: 'Awaiting procedure', labelKey: 'opt_heart_procedure_awaiting' },
      { value: 'Prefer not to say', labelKey: 'opt_heart_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 2),
  },

  CONDITION_FOLLOWUP_CANCER: {
    id: 'CONDITION_FOLLOWUP_CANCER',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_CANCER_title',
    descKey: 'q_CONDITION_FOLLOWUP_CANCER_desc',
    options: [
      { value: 'Active treatment', labelKey: 'opt_cancer_active' },
      { value: 'In remission', labelKey: 'opt_cancer_remission' },
      { value: 'Surveillance', labelKey: 'opt_cancer_surveillance' },
      { value: 'Prefer not to say', labelKey: 'opt_cancer_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 3),
  },

  CONDITION_FOLLOWUP_RESPIRATORY: {
    id: 'CONDITION_FOLLOWUP_RESPIRATORY',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_RESPIRATORY_title',
    descKey: 'q_CONDITION_FOLLOWUP_RESPIRATORY_desc',
    options: [
      { value: 'Mild/occasional', labelKey: 'opt_resp_mild' },
      { value: 'Moderate/regular medication', labelKey: 'opt_resp_moderate' },
      { value: 'Severe/daily medication', labelKey: 'opt_resp_severe' },
      { value: 'Prefer not to say', labelKey: 'opt_resp_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 4),
  },

  CONDITION_FOLLOWUP_KIDNEY: {
    id: 'CONDITION_FOLLOWUP_KIDNEY',
    optional: false,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_CONDITION_FOLLOWUP_KIDNEY_title',
    descKey: 'q_CONDITION_FOLLOWUP_KIDNEY_desc',
    options: [
      { value: 'Early stage', labelKey: 'opt_kidney_early' },
      { value: 'Dialysis', labelKey: 'opt_kidney_dialysis' },
      { value: 'Post-transplant', labelKey: 'opt_kidney_transplant' },
      { value: 'Prefer not to say', labelKey: 'opt_kidney_prefer_not' },
    ],
    nextQuestion: (answers) => getNextFollowupQuestion(answers, 5),
  },

  LIFESTYLE_ACTIVITY: {
    id: 'LIFESTYLE_ACTIVITY',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_LIFESTYLE_ACTIVITY_title',
    descKey: 'q_LIFESTYLE_ACTIVITY_desc',
    options: [
      { value: 'Sedentary (little to no exercise)', labelKey: 'opt_act_sedentary' },
      { value: 'Lightly active (light walking 1-3 days/week)', labelKey: 'opt_act_light' },
      { value: 'Moderately active (exercise 3-5 days/week)', labelKey: 'opt_act_moderate' },
      { value: 'Very active (intense exercise daily)', labelKey: 'opt_act_active' },
      { value: 'Prefer not to say', labelKey: 'opt_act_prefer_not' },
    ],
    nextQuestion: () => 'LIFESTYLE_DIET',
  },

  LIFESTYLE_DIET: {
    id: 'LIFESTYLE_DIET',
    optional: true,
    selectionMode: 'single',
    inputType: 'single_select',
    titleKey: 'q_LIFESTYLE_DIET_title',
    descKey: 'q_LIFESTYLE_DIET_desc',
    options: [
      { value: 'Vegetarian', labelKey: 'opt_diet_veg' },
      { value: 'Eggetarian', labelKey: 'opt_diet_eggetarian' },
      { value: 'Non-vegetarian', labelKey: 'opt_diet_nonveg' },
      { value: 'Vegan', labelKey: 'opt_diet_vegan' },
      { value: 'Jain vegetarian', labelKey: 'opt_diet_jain' },
      { value: 'Prefer not to say', labelKey: 'opt_diet_prefer_not' },
    ],
    nextQuestion: () => 'MEDICATIONS',
  },

  MEDICATIONS: {
    id: 'MEDICATIONS',
    optional: true,
    inputType: 'text',
    titleKey: 'q_MEDICATIONS_title',
    descKey: 'q_MEDICATIONS_desc',
    nextQuestion: () => 'DOCUMENTS',
  },

  DOCUMENTS: {
    id: 'DOCUMENTS',
    optional: true,
    selectionMode: 'multi',
    inputType: 'multi_select',
    titleKey: 'q_DOCUMENTS_title',
    descKey: 'q_DOCUMENTS_desc',
    options: [
      { value: 'Insurance policy (PDF)', labelKey: 'opt_doc_policy' },
      { value: 'Prescription', labelKey: 'opt_doc_prescription' },
      { value: 'Medical reports', labelKey: 'opt_doc_reports' },
      { value: 'Bills and receipts', labelKey: 'opt_doc_bills' },
      { value: 'None right now', labelKey: 'opt_doc_none', exclusive: true },
    ],
    nextQuestion: () => 'REVIEW',
  },

  // Final Review Screen
  REVIEW: {
    id: 'REVIEW',
    optional: false,
    inputType: 'review',
    titleKey: 'q_REVIEW_title',
    descKey: 'q_REVIEW_desc',
    nextQuestion: () => null,
  },
}

export const INITIAL_QUESTION_ID: QuestionId = 'LANGUAGE_SELECT'
export const TOTAL_QUESTIONS_COUNT = Object.keys(QUESTIONS).length

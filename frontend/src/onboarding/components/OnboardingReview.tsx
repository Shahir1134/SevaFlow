import React from 'react'
import { useOnboarding } from '../OnboardingProvider'
import { useI18n } from '../../i18n/useI18n'
import type { QuestionId } from '../types'
import { CheckCircle2, Edit3, ArrowLeft, ShieldCheck, HeartPulse, FileText } from 'lucide-react'

export const OnboardingReview: React.FC = () => {
  const { state, answerQuestion, dispatch, goBack } = useOnboarding()
  const { t } = useI18n()

  const answers = state.answers

  const handleEdit = (targetQuestion: QuestionId) => {
    // Navigate directly back to question while preserving history
    const targetIdx = state.history.indexOf(targetQuestion)
    if (targetIdx !== -1) {
      const slicedHistory = state.history.slice(0, targetIdx)
      dispatch({
        type: 'RESTORE',
        answers: state.answers,
        history: [...slicedHistory, targetQuestion],
      })
    } else {
      // If it wasn't in history yet, jump to it directly
      dispatch({
        type: 'RESTORE',
        answers: state.answers,
        history: [...state.history, targetQuestion],
      })
    }
  }

  const handleComplete = () => {
    answerQuestion('REVIEW', 'COMPLETED')
  }

  const renderVal = (v: string | string[] | undefined): string => {
    if (!v || (Array.isArray(v) && v.length === 0)) return '—'
    if (Array.isArray(v)) return v.join(', ')
    return String(v)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {t('q_REVIEW_title')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {t('q_REVIEW_desc')}
        </p>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {/* Section 1: Demographics */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Personal & Location</span>
            </div>
            <button
              type="button"
              onClick={() => handleEdit('PROFILE_OWNER')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('edit')}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Profile For:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['PROFILE_OWNER'])}</span>
            </div>
            {answers['RELATIONSHIP'] && (
              <div>
                <span className="text-slate-500 block">Relationship:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['RELATIONSHIP'])}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Age Group / Exact:</span>
              <span className="font-medium text-slate-800">
                {renderVal(answers['AGE_GROUP'])} {answers['AGE_EXACT'] ? `(${answers['AGE_EXACT']} yrs)` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Gender:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['GENDER'])}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">Location:</span>
              <span className="font-medium text-slate-800">
                {renderVal(answers['LOCATION_STATE'])}
                {answers['LOCATION_DISTRICT'] ? `, ${answers['LOCATION_DISTRICT']}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Coverage & Schemes */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>Coverage & PM-JAY</span>
            </div>
            <button
              type="button"
              onClick={() => handleEdit('PMJAY_CARD')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('edit')}</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">PM-JAY Card:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['PMJAY_CARD'])}</span>
            </div>
            {answers['PMJAY_CARD_NUMBER_SKIP'] && (
              <div>
                <span className="text-slate-500 block">Card No. (User-Reported):</span>
                <span className="font-medium text-slate-800">{renderVal(answers['PMJAY_CARD_NUMBER_SKIP'])}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Other Insurance:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['OTHER_INSURANCE'])}</span>
            </div>
            {answers['INSURANCE_TYPE'] && (
              <div>
                <span className="text-slate-500 block">Policy Type:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['INSURANCE_TYPE'])}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Household Income:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['INCOME_BAND'])}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Household Size:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['HOUSEHOLD_SIZE'])}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Health & Lifestyle */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
              <HeartPulse className="w-4 h-4" />
              <span>Health Conditions & Priorities</span>
            </div>
            <button
              type="button"
              onClick={() => handleEdit('HEALTH_CONDITIONS')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('edit')}</span>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block">Diagnosed Conditions:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['HEALTH_CONDITIONS'])}</span>
            </div>
            {answers['FAMILY_HISTORY'] && (
              <div>
                <span className="text-slate-500 block">Family History:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['FAMILY_HISTORY'])}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Care Priorities:</span>
              <span className="font-medium text-slate-800">{renderVal(answers['HEALTHCARE_PRIORITIES'])}</span>
            </div>
            {answers['WHO_NEEDS_SUPPORT'] && (
              <div>
                <span className="text-slate-500 block">Managing Care For:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['WHO_NEEDS_SUPPORT'])}</span>
              </div>
            )}
            {answers['TREATMENT_BUDGET'] && (
              <div>
                <span className="text-slate-500 block">Preferred Treatment Budget:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['TREATMENT_BUDGET'])}</span>
              </div>
            )}
            {answers['MEDICATIONS'] && (
              <div>
                <span className="text-slate-500 block">Medications:</span>
                <span className="font-medium text-slate-800">{renderVal(answers['MEDICATIONS'])}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimers Notice */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 leading-relaxed">
        {t('reviewSubmitNotice')} {t('sessionStorageNotice')}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>

        <button
          type="button"
          onClick={handleComplete}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer ring-1 ring-indigo-500"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('completed')}</span>
        </button>
      </div>
    </div>
  )
}

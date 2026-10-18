import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '../OnboardingProvider'
import { useI18n } from '../../i18n/useI18n'
import type { MessageKey } from '../../i18n/types'
import { SingleSelect } from './SingleSelect'
import { MultiSelect } from './MultiSelect'
import { TextInput } from './TextInput'
import { StateDropdown } from './StateDropdown'
import { SearchableStateDistrict } from './SearchableStateDistrict'
import { OnboardingReview } from './OnboardingReview'
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Info,
  Trash2,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react'

export const QuestionCard: React.FC = () => {
  const {
    state,
    currentQuestionDef,
    answerQuestion,
    goBack,
    skipQuestion,
    clearAnswers,
    canGoBack,
    canSkip,
    progressPercentage,
    currentStepNumber,
    totalSteps,
  } = useOnboarding()

  const { t } = useI18n()

  const currentAnswer = state.answers[currentQuestionDef.id]

  // Local draft state for current question so user can pick/type before clicking Next
  const [localValue, setLocalValue] = useState<string | string[]>(() => {
    if (currentAnswer !== undefined) return currentAnswer
    if (currentQuestionDef.inputType === 'multi_select') return []
    return ''
  })

  // Direction tracker for slide animations: 1 = forward, -1 = back
  const [direction, setDirection] = useState<number>(1)
  const [prevHistoryLength, setPrevHistoryLength] = useState<number>(state.history.length)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (state.history.length < prevHistoryLength) {
      setDirection(-1)
    } else {
      setDirection(1)
    }
    setPrevHistoryLength(state.history.length)

    // Reset local value when active question changes
    const existing = state.answers[currentQuestionDef.id]
    if (existing !== undefined) {
      setLocalValue(existing)
    } else {
      setLocalValue(currentQuestionDef.inputType === 'multi_select' ? [] : '')
    }
  }, [currentQuestionDef.id, state.answers, state.history.length, prevHistoryLength, currentQuestionDef.inputType])

  const isAnswerValid = (): boolean => {
    if (currentQuestionDef.optional) return true
    if (currentQuestionDef.inputType === 'multi_select') {
      return Array.isArray(localValue) && localValue.length > 0
    }
    if (typeof localValue === 'string') {
      return localValue.trim().length > 0
    }
    return false
  }

  const handleNext = () => {
    if (!isAnswerValid() || isSubmitting) return
    setIsSubmitting(true)
    answerQuestion(currentQuestionDef.id, localValue)
    setTimeout(() => setIsSubmitting(false), 250)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleNext()
  }

  const handleSingleSelectChange = (val: string) => {
    setLocalValue(val)
    setIsSubmitting(true)
    // Snappy 200ms tactile feedback so the user sees their card click with checkmark
    setTimeout(() => {
      answerQuestion(currentQuestionDef.id, val)
      setIsSubmitting(false)
    }, 200)
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Session Storage Transparency Alert */}
      <div className="mb-6 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 shadow-2xs">
        <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">{t('sessionStorageNotice')}</span>
        </div>
      </div>

      {/* Progress & Top Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              Question {currentStepNumber} of {totalSteps}
            </span>
            {currentQuestionDef.stepBadge && (
              <span className="hidden sm:inline-block text-slate-500 font-medium">
                • {currentQuestionDef.stepBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-600">{progressPercentage}%</span>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
              title={t('clearAll')}
              aria-label={t('clearAll')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-normal">{t('clearAll')}</span>
            </button>
          </div>
        </div>

        {/* Multi-gradient progress bar */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('clearAll')}</h3>
            <p className="text-sm text-slate-600 mb-6">{t('clearConfirm')}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAnswers()
                  setShowClearConfirm(false)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer transition-colors"
              >
                {t('clearAll')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Question Card */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentQuestionDef.id}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 25 : -25 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction < 0 ? 25 : -25 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/90 p-6 sm:p-9"
        >
          {currentQuestionDef.inputType === 'review' ? (
            <OnboardingReview />
          ) : (
            <form
              role="form"
              aria-labelledby="question-heading"
              onSubmit={handleFormSubmit}
              className="space-y-6"
            >
              {/* Question Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                    {currentQuestionDef.optional ? t('optional') : t('required')}
                  </span>
                  {currentQuestionDef.stepBadge && (
                    <span className="text-xs font-semibold text-slate-500">
                      {currentQuestionDef.stepBadge}
                    </span>
                  )}
                </div>

                <h2
                  id="question-heading"
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug tracking-tight"
                >
                  {t(currentQuestionDef.titleKey as MessageKey)}
                </h2>

                {currentQuestionDef.descKey && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t(currentQuestionDef.descKey as MessageKey)}
                  </p>
                )}

                {/* Friendly Empathy Context Box */}
                {currentQuestionDef.whyWeAskKey && (
                  <div className="mt-3 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900 leading-relaxed">
                    <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-indigo-950">Why this matters: </span>
                      <span>{currentQuestionDef.whyWeAskKey}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer Notice if present */}
              {currentQuestionDef.disclaimerKey && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-950">
                      {t(currentQuestionDef.disclaimerKey as MessageKey)}
                    </span>
                  </div>
                </div>
              )}

              {/* Input Component by Type */}
              <div className="py-1">
                {currentQuestionDef.inputType === 'single_select' && (
                  <SingleSelect
                    options={currentQuestionDef.options ?? []}
                    value={typeof localValue === 'string' ? localValue : ''}
                    onChange={handleSingleSelectChange}
                    groupName={currentQuestionDef.id}
                  />
                )}

                {currentQuestionDef.inputType === 'multi_select' && (
                  <MultiSelect
                    options={currentQuestionDef.options ?? []}
                    value={Array.isArray(localValue) ? localValue : []}
                    onChange={(vals) => setLocalValue(vals)}
                    groupName={currentQuestionDef.id}
                  />
                )}

                {currentQuestionDef.inputType === 'text' && (
                  <TextInput
                    id={currentQuestionDef.id}
                    value={typeof localValue === 'string' ? localValue : ''}
                    onChange={(val) => setLocalValue(val)}
                    placeholder={t('enterDistrict')}
                  />
                )}

                {currentQuestionDef.inputType === 'number' && (
                  <TextInput
                    id={currentQuestionDef.id}
                    type="number"
                    min={0}
                    max={120}
                    value={typeof localValue === 'string' ? localValue : ''}
                    onChange={(val) => setLocalValue(val)}
                    placeholder="e.g. 35"
                  />
                )}

                {currentQuestionDef.inputType === 'state_dropdown' && (
                  <StateDropdown
                    id={currentQuestionDef.id}
                    value={typeof localValue === 'string' ? localValue : ''}
                    onChange={(val) => setLocalValue(val)}
                  />
                )}

                {currentQuestionDef.inputType === 'state_district' && (
                  <SearchableStateDistrict
                    id={currentQuestionDef.id}
                    stateValue={typeof localValue === 'string' ? localValue : ''}
                    districtValue={typeof state.answers['LOCATION_DISTRICT'] === 'string' ? (state.answers['LOCATION_DISTRICT'] as string) : ''}
                    onStateChange={(st) => setLocalValue(st)}
                    onDistrictChange={(dist) => {
                      answerQuestion('LOCATION_DISTRICT', dist)
                    }}
                  />
                )}
              </div>

              {/* Navigation Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  {canGoBack && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{t('back')}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canSkip && (
                    <button
                      type="button"
                      onClick={skipQuestion}
                      className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm font-medium transition-colors cursor-pointer"
                    >
                      {t('skip')}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!isAnswerValid() || isSubmitting}
                    className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                      isAnswerValid()
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {currentQuestionDef.inputType === 'multi_select' && Array.isArray(localValue) && localValue.length > 0
                        ? `${t('continue')} (${localValue.length})`
                        : t('continue')}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

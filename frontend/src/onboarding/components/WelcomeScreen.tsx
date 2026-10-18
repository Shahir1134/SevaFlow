import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import {
  HeartHandshake,
  ShieldCheck,
  FileSearch,
  Receipt,
  Lock,
  ArrowRight,
} from 'lucide-react'

interface WelcomeScreenProps {
  onGetStarted: () => void
  onAlreadyHaveAccount: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onAlreadyHaveAccount,
}) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  const hasCompletedBefore =
    typeof window !== 'undefined' &&
    localStorage.getItem('healthconnect_onboarding_completed') === 'true'

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="w-full max-w-xl mx-auto"
      >
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10 text-center space-y-6">
          {/* Logo & Brand Emblem */}
          <div className="relative inline-block mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
              <HeartHandshake className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
            </div>
          </div>

          {/* Headline & Supporting Text */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide">
              <span>HealthConnect India</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t('welcomeHeadline')}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              {t('welcomeSupporting')}
            </p>
          </div>

          {/* 3 Key Value Props */}
          <div className="grid grid-cols-1 gap-2.5 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                {t('welcomeFeature1')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileSearch className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                {t('welcomeFeature2')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Receipt className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-snug">
                {t('welcomeFeature3')}
              </span>
            </div>
          </div>

          {/* Privacy Reassurance Note */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-2.5 text-left text-xs text-slate-500">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="leading-relaxed">{t('welcomePrivacyReassurance')}</span>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ring-1 ring-indigo-500"
            >
              <span>{t('welcomeGetStarted')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={onAlreadyHaveAccount}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <span>{t('welcomeAlreadyAccount')}</span>
              </button>

              {hasCompletedBefore && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer py-1"
                >
                  Go to Dashboard &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

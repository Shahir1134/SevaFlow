import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../OnboardingProvider'
import { useI18n } from '../../i18n/useI18n'
import {
  CheckCircle2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  HeartPulse,
  RotateCcw,
  Languages,
} from 'lucide-react'

export const OnboardingComplete: React.FC = () => {
  const { state, clearAnswers } = useOnboarding()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [isEntering, setIsEntering] = useState(false)

  const answers = state.answers

  const handleEnterDashboard = () => {
    setIsEntering(true)
    localStorage.setItem('healthconnect_onboarding_completed', 'true')
    setTimeout(() => {
      navigate('/dashboard')
    }, 400)
  }

  const handleCreateAccount = () => {
    localStorage.setItem('healthconnect_onboarding_completed', 'true')
    navigate('/login', { state: { fromOnboarding: true } })
  }

  const handleRetake = () => {
    clearAnswers()
  }

  const langCode = (answers['LANGUAGE_SELECT'] as string) || 'en'
  const langLabel = langCode === 'hi' ? 'हिंदी (Hindi)' : langCode === 'mr' ? 'मराठी (Marathi)' : 'English'

  const owner = (answers['PROFILE_OWNER'] as string) || 'Myself'
  const age = (answers['AGE_GROUP'] as string) || 'Adult'
  const gender = (answers['GENDER'] as string) || ''
  const household = (answers['HOUSEHOLD_SIZE'] as string) || 'Family'

  const stateLoc = (answers['LOCATION_STATE'] as string) || 'India'
  const districtLoc = (answers['LOCATION_DISTRICT'] as string) || ''

  const pmjay = (answers['PMJAY_CARD'] as string) || 'None'
  const hasPmjay = typeof pmjay === 'string' && pmjay.toLowerCase().includes('yes')

  const priorities = Array.isArray(answers['HEALTHCARE_PRIORITIES'])
    ? answers['HEALTHCARE_PRIORITIES']
    : []

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-6 sm:p-10 text-center space-y-6">
        {/* Celebratory Emblem */}
        <div className="relative inline-block mx-auto">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-teal-200 border-2 border-white">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>10 Questions Completed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Family Health Profile is Ready
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            We’ve configured your local network, hospital directories, and AI policy analysis based on your answers.
          </p>
        </div>

        {/* 4 Interactive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-1">
          {/* Card 1: Member Profile */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Family Profile</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {owner} {gender ? `• ${gender}` : ''}
            </div>
            <div className="text-xs text-slate-500">
              Age: {age} • Household: {household}
            </div>
          </div>

          {/* Card 2: Location & Care Centers */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location Network</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {stateLoc} {districtLoc ? `• ${districtLoc}` : ''}
            </div>
            <div className="text-xs text-teal-700 font-medium">
              Empanelled PM-JAY & local network synced
            </div>
          </div>

          {/* Card 3: Insurance & PM-JAY */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coverage Status</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {hasPmjay ? 'Ayushman Bharat Cardholder' : 'Standard Healthcare Guidance'}
            </div>
            <div className="text-xs text-slate-500">
              Private Ins: {(answers['OTHER_INSURANCE'] as string) || 'Not specified'}
            </div>
          </div>

          {/* Card 4: Language & Focus */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Languages className="w-3.5 h-3.5" />
              <span>Language & Priorities</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {langLabel}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {priorities.length > 0 ? priorities.slice(0, 2).join(', ') : 'All healthcare services'}
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={handleEnterDashboard}
            disabled={isEntering}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-200 hover:shadow-xl transition-all cursor-pointer ring-1 ring-indigo-500 active:scale-[0.99]"
          >
            <span>{isEntering ? 'Entering Dashboard...' : 'Enter Your Health Dashboard'}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCreateAccount}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>{t('btnCreateAccount')}</span>
            </button>

            <button
              type="button"
              onClick={handleRetake}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer py-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake 10-Question Intake</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

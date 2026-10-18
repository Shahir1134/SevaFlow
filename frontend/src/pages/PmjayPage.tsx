import React, { useState } from 'react'
import { ServiceUnavailable } from '../components/ServiceUnavailable'
import { Award, ShieldAlert, ExternalLink, CheckCircle2, Save } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export const PmjayPage: React.FC = () => {
  const { t } = useI18n()
  const [savedCardNumber, setSavedCardNumber] = useState(() => {
    try {
      return localStorage.getItem('healthconnect_user_pmjay_card') || ''
    } catch {
      return ''
    }
  })
  const [inputCard, setInputCard] = useState(savedCardNumber)
  const [justSaved, setJustSaved] = useState(false)

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      localStorage.setItem('healthconnect_user_pmjay_card', inputCard.trim())
      setSavedCardNumber(inputCard.trim())
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-orange-600" />
          <span>Ayushman Bharat — PM-JAY Scheme Guide & Status</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Government of India's flagship health protection scheme providing ₹5,00,000 annual cover per family.
        </p>
      </div>

      {/* Critical Verification Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="block font-bold text-amber-950 mb-0.5">
            Important Notice on PM-JAY Verification:
          </strong>
          {t('pmjayDisclaimer')}
        </div>
      </div>

      {/* Live Verification API Unavailable Notice */}
      <ServiceUnavailable
        featureName="Direct NHA Beneficiary Verification"
        reason="Automated instant PM-JAY card validation requires direct API access to the National Health Authority (NHA) database with government-issued nodal credentials. Use the official NHA beneficiary portal linked below."
        officialSourceUrl="https://beneficiary.nha.gov.in"
        officialSourceName="Official NHA Beneficiary Portal (beneficiary.nha.gov.in)"
      />

      {/* Scheme Key Facts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Annual Coverage</span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">₹5,00,000</div>
          <span className="text-xs text-slate-600 mt-1 block">
            Per family per year for secondary and tertiary hospitalization.
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Family Size & Age</span>
          <div className="text-2xl font-extrabold text-orange-600 mt-1">No Cap</div>
          <span className="text-xs text-slate-600 mt-1 block">
            Covers all family members regardless of age or preexisting illnesses.
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Empanelled Hospitals</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">28,000+</div>
          <span className="text-xs text-slate-600 mt-1 block">
            Cashless access across public & private empanelled hospitals pan-India.
          </span>
        </div>
      </div>

      {/* Official NHA Portals Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Official Government Portals for PM-JAY
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://beneficiary.nha.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 block">
                NHA Beneficiary Portal
              </span>
              <span className="text-xs text-slate-500">
                Check eligibility & generate Ayushman Card
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </a>

          <a
            href="https://hospitals.pmjay.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 block">
                Find Empanelled Hospital
              </span>
              <span className="text-xs text-slate-500">
                Search cashless hospitals by district and speciality
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </a>

          <a
            href="https://mera.pmjay.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 block">
                Mera PM-JAY Portal
              </span>
              <span className="text-xs text-slate-500">
                Know if your family is covered under SECC
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </a>

          <a
            href="https://abha.abdm.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 block">
                ABHA Digital Health ID
              </span>
              <span className="text-xs text-slate-500">
                Ayushman Bharat Digital Mission health account
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </a>
        </div>
      </div>

      {/* User-Reported Card Number Local Storage */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Save PM-JAY Card Number (Self-Reported Only)
        </h2>
        <p className="text-xs text-slate-600">
          You can store your Ayushman Bharat card number locally for your family's personal reference. (Note: Do NOT enter your Aadhaar number).
        </p>

        <form onSubmit={handleSaveCard} className="flex items-center gap-3 max-w-md">
          <input
            type="text"
            value={inputCard}
            onChange={(e) => setInputCard(e.target.value)}
            placeholder="e.g. AB-12345678"
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </form>

        {justSaved && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved in local browser memory as user-reported.</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default PmjayPage

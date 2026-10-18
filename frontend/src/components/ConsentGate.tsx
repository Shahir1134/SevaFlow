import React from 'react'
import { ShieldCheck } from 'lucide-react'

export interface ConsentGateProps {
  id?: string | undefined
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean | undefined
  label?: string | undefined
}

export const ConsentGate: React.FC<ConsentGateProps> = ({
  id = 'consent-gate-checkbox',
  checked,
  onChange,
  disabled = false,
  label = 'I give explicit consent to analyze this health document and policy details solely for providing guidance and claim support. I understand this does not constitute medical diagnosis.',
}) => {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
      <label
        htmlFor={id}
        className="flex items-start gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center h-5 mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center gap-1 font-semibold text-slate-900 mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explicit Consent Required</span>
          </div>
          <p>{label}</p>
        </div>
      </label>
    </div>
  )
}

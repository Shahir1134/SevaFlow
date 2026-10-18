import React from 'react'
import { INDIAN_STATES_AND_UTS } from '../indianStates'
import { useI18n } from '../../i18n/useI18n'

interface StateDropdownProps {
  id: string
  value?: string | undefined
  onChange: (value: string) => void
  disabled?: boolean | undefined
  error?: string | undefined
}

export const StateDropdown: React.FC<StateDropdownProps> = ({
  id,
  value = '',
  onChange,
  disabled = false,
  error,
}) => {
  const { t } = useI18n()

  const states = INDIAN_STATES_AND_UTS.filter((r) => r.type === 'state')
  const uts = INDIAN_STATES_AND_UTS.filter((r) => r.type === 'ut')

  return (
    <div className="w-full">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('selectState')}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
          error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-indigo-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <option value="">-- {t('selectState')} --</option>
        <optgroup label="States (28)">
          {states.map((st) => (
            <option key={st.code} value={st.name}>
              {st.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Union Territories (8)">
          {uts.map((ut) => (
            <option key={ut.code} value={ut.name}>
              {ut.name}
            </option>
          ))}
        </optgroup>
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

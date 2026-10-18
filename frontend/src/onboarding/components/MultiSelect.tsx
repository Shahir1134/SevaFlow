import React from 'react'
import type { QuestionOption } from '../types'
import { useI18n } from '../../i18n/useI18n'
import type { MessageKey } from '../../i18n/types'
import { Check } from 'lucide-react'

import { en } from '../../i18n/catalogs/en'

interface MultiSelectProps {
  options: QuestionOption[]
  value?: string[] | undefined
  onChange: (value: string[]) => void
  disabled?: boolean | undefined
  groupName?: string | undefined
}

export function handleMultiSelectToggle(
  currentValues: string[],
  toggledOption: QuestionOption,
  allOptions: QuestionOption[]
): string[] {
  const isAlreadySelected = currentValues.includes(toggledOption.value)

  if (isAlreadySelected) {
    // Deselect
    return currentValues.filter((v) => v !== toggledOption.value)
  }

  // Toggled option is newly selected
  if (toggledOption.exclusive) {
    // Exclusive option clears all other selections
    return [toggledOption.value]
  }

  // Non-exclusive option selected: remove any currently selected exclusive options
  const exclusiveValues = new Set(
    allOptions.filter((opt) => opt.exclusive).map((opt) => opt.value)
  )
  const nonExclusiveCurrent = currentValues.filter((v) => !exclusiveValues.has(v))

  return [...nonExclusiveCurrent, toggledOption.value]
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  disabled = false,
  groupName = 'multi-select-group',
}) => {
  const { t } = useI18n()

  const handleToggle = (option: QuestionOption) => {
    const next = handleMultiSelectToggle(value, option, options)
    onChange(next)
  }

  const getLabel = (opt: QuestionOption): string => {
    if (opt.labelKey in en) {
      return t(opt.labelKey as MessageKey)
    }
    return opt.labelKey
  }

  return (
    <div
      role="group"
      aria-label={groupName}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {options.map((option) => {
        const isSelected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => handleToggle(option)}
            className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer select-none group ${
              isSelected
                ? 'border-indigo-600 bg-gradient-to-br from-indigo-50/90 to-purple-50/40 text-indigo-950 shadow-sm ring-2 ring-indigo-500/80 scale-[1.01]'
                : 'border-slate-200/90 bg-white hover:border-indigo-200 hover:bg-slate-50/70 text-slate-800 hover:shadow-xs active:scale-[0.99]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col pr-2">
              <span className="font-semibold text-sm sm:text-base leading-snug">
                {getLabel(option)}
              </span>
              {option.descriptionKey && (
                <span className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t(option.descriptionKey as MessageKey)}
                </span>
              )}
            </div>
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0 transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                  : 'border-slate-300 bg-white group-hover:border-slate-400'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { INDIAN_STATES_AND_UTS } from '../indianStates'
import { useI18n } from '../../i18n/useI18n'
import { Search, MapPin, Check } from 'lucide-react'

interface SearchableStateDistrictProps {
  id: string
  stateValue?: string | undefined
  districtValue?: string | undefined
  onStateChange: (state: string) => void
  onDistrictChange: (district: string) => void
  disabled?: boolean | undefined
  error?: string | undefined
}

export const SearchableStateDistrict: React.FC<SearchableStateDistrictProps> = ({
  id,
  stateValue = '',
  districtValue = '',
  onStateChange,
  onDistrictChange,
  disabled = false,
  error,
}) => {
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredRegions = useMemo(() => {
    if (!searchTerm.trim()) {
      return INDIAN_STATES_AND_UTS
    }
    const q = searchTerm.toLowerCase().trim()
    return INDIAN_STATES_AND_UTS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    )
  }, [searchTerm])

  const handleSelectState = (name: string) => {
    onStateChange(name)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="w-full space-y-4">
      {/* State Selection */}
      <div>
        <label
          htmlFor={`${id}-state-search`}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
        >
          {t('selectState')} <span className="text-red-500">*</span>
        </label>

        {/* Selected pill or Selector Button */}
        <div className="relative">
          <button
            id={`${id}-state-search`}
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all bg-white cursor-pointer ${
              stateValue
                ? 'border-indigo-600 text-slate-900 ring-1 ring-indigo-500'
                : 'border-slate-300 text-slate-400 hover:border-slate-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <MapPin className={`w-4 h-4 flex-shrink-0 ${stateValue ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className={`text-sm truncate ${stateValue ? 'font-medium text-slate-900' : ''}`}>
                {stateValue || t('selectState')}
              </span>
            </div>
            <span className="text-xs text-indigo-600 font-semibold ml-2 flex-shrink-0">
              {isOpen ? t('close') : stateValue ? t('edit') : t('search')}
            </span>
          </button>

          {/* Search Dropdown Popover */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                      }
                    }}
                    placeholder={t('search') + ' State / UT...'}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
                {filteredRegions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching State or UT found.
                  </div>
                ) : (
                  filteredRegions.map((region) => {
                    const isSelected = stateValue === region.name
                    return (
                      <button
                        key={region.code}
                        type="button"
                        onClick={() => handleSelectState(region.name)}
                        className={`w-full px-3 py-2.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{region.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.5 rounded bg-slate-100">
                            {region.type}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* District / City Input */}
      <div>
        <label
          htmlFor={`${id}-district`}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
        >
          {t('enterDistrict')} <span className="text-slate-400 font-normal lowercase">({t('optional')})</span>
        </label>
        <div className="relative">
          <input
            id={`${id}-district`}
            type="text"
            value={districtValue}
            disabled={disabled}
            onChange={(e) => onDistrictChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
              }
            }}
            placeholder={t('enterDistrict')}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all border-slate-300 focus:border-indigo-500 ${
              disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
            }`}
          />
        </div>
      </div>
    </div>
  )
}

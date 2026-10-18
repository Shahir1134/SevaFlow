import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import type { Language } from '../i18n/types'
import { Languages, User, HeartPulse, Menu, Check, ChevronDown } from 'lucide-react'

export interface HeaderProps {
  onToggleSidebar?: (() => void) | undefined
}

interface LanguageOption {
  code: Language
  label: string
  nativeName: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
]

const DEFAULT_LANGUAGE_OPTION: LanguageOption = { code: 'en', label: 'English', nativeName: 'English' }

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { language, setLanguage, t } = useI18n()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentOption: LanguageOption =
    LANGUAGE_OPTIONS.find((l) => l.code === language) ?? DEFAULT_LANGUAGE_OPTION

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code)
    setDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Mobile menu button & Branding */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link
            to={
              typeof window !== 'undefined' &&
              localStorage.getItem('healthconnect_onboarding_completed') === 'true'
                ? '/dashboard'
                : '/'
            }
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <HeartPulse className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                HealthConnect <span className="text-orange-600">India</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-medium -mt-1">
                AI Healthcare Platform for Indian Families
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Language Dropdown & User Profile */}
        <div className="flex items-center gap-3">
          {/* Smooth Multi-Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label={`Language selector. Current language is ${currentOption.label}`}
            >
              <Languages className="w-4 h-4 text-indigo-600" />
              <span className="tracking-wide">{currentOption.nativeName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Language / भाषा
                </div>
                {LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = opt.code === language
                  return (
                    <button
                      key={opt.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectLanguage(opt.code)}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{opt.nativeName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* User profile link */}
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('navLogin')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

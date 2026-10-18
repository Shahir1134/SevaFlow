import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  startTransition,
  type ReactNode,
} from 'react'
import type { Language, MessageKey } from './types'
import { en } from './catalogs/en'
import { hi } from './catalogs/hi'
import { mr } from './catalogs/mr'

const STORAGE_KEY = 'healthconnect_lang'

export interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: MessageKey) => string
}

const catalogs: Record<Language, Record<MessageKey, string>> = {
  en,
  hi,
  mr,
}

const I18nContext = createContext<I18nContextType | null>(null)

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'en' || saved === 'hi' || saved === 'mr') {
        return saved
      }
    } catch {
      // ignore
    }
    return 'en'
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // ignore
    }
    document.documentElement.lang = language
  }, [language])

  // Non-blocking, smooth concurrent transition for language switching
  const setLanguage = useCallback((lang: Language) => {
    startTransition(() => {
      setLanguageState(lang)
    })
  }, [])

  const t = useCallback(
    (key: MessageKey): string => {
      const currentCatalog = catalogs[language]
      const translation = currentCatalog ? currentCatalog[key] : undefined
      if (translation !== undefined) {
        return translation
      }
      const fallback = catalogs.en[key]
      return fallback !== undefined ? fallback : key
    },
    [language]
  )

  const contextValue = useMemo<I18nContextType>(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  )

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    const fallbackLang: Language = 'en'
    return {
      language: fallbackLang,
      setLanguage: () => {},
      t: (key: MessageKey) => en[key] ?? key,
    }
  }
  return context
}

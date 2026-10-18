import React from 'react'
import { AlertCircle } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export interface DataNoticeProps {
  customMessage?: string | undefined
  variant?: ('info' | 'warning') | undefined
}

export const DataNotice: React.FC<DataNoticeProps> = ({
  customMessage,
  variant = 'info',
}) => {
  const { t } = useI18n()

  const isWarning = variant === 'warning'

  return (
    <div
      role="note"
      className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
        isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
      }`}
    >
      <AlertCircle
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
          isWarning ? 'text-amber-600' : 'text-indigo-600'
        }`}
      />
      <div>
        <p className="font-medium">
          {customMessage || t('aiDisclaimer')}
        </p>
      </div>
    </div>
  )
}

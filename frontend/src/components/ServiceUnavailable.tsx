import React from 'react'
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { useI18n } from '../i18n/useI18n'

export interface ServiceUnavailableProps {
  featureName: string
  reason?: string | undefined
  officialSourceUrl?: string | undefined
  officialSourceName?: string | undefined
  onRetry?: (() => void) | undefined
  isRetrying?: boolean | undefined
}

export const ServiceUnavailable: React.FC<ServiceUnavailableProps> = ({
  featureName,
  reason,
  officialSourceUrl,
  officialSourceName = 'Official Source',
  onRetry,
  isRetrying = false,
}) => {
  const { t } = useI18n()

  return (
    <div
      role="region"
      aria-label={`${featureName} ${t('serviceUnavailableTitle')}`}
      className="p-6 sm:p-8 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 max-w-2xl mx-auto shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
              SERVICE_UNAVAILABLE
            </span>
            <span className="text-xs text-amber-800 font-medium">
              {featureName}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold text-amber-950">
            {t('serviceUnavailableTitle')}: {featureName}
          </h3>

          <p className="mt-2 text-sm text-amber-900/90 leading-relaxed">
            {reason || t('serviceUnavailableDesc')}
          </p>

          {/* Official Source Link */}
          {officialSourceUrl && (
            <div className="mt-4 pt-3 border-t border-amber-200/60">
              <span className="text-xs font-semibold text-amber-900 block mb-1">
                Recommended Alternative / Official Registry:
              </span>
              <a
                href={officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
              >
                <span>{officialSourceName}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          {onRetry && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>{isRetrying ? t('loading') : t('retry')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

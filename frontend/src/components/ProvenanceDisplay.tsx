import React from 'react'
import { Shield, Clock, Database, CheckCircle, HelpCircle } from 'lucide-react'

export interface ProvenanceDisplayProps {
  source: string
  retrievedAt: string
  confidenceLevel?: ('VERIFIED' | 'HIGH' | 'MEDIUM' | 'USER_REPORTED' | 'LOW') | undefined
  modelUsed?: string | undefined
  sha256Hash?: string | undefined
  verified?: boolean | undefined
}

export const ProvenanceDisplay: React.FC<ProvenanceDisplayProps> = ({
  source,
  retrievedAt,
  confidenceLevel = 'USER_REPORTED',
  modelUsed,
  sha256Hash,
  verified = false,
}) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'HIGH':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'USER_REPORTED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const formattedDate = (() => {
    try {
      return new Date(retrievedAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return retrievedAt
    }
  })()

  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1.5 font-mono">
      <div className="flex items-center justify-between flex-wrap gap-2 font-sans font-medium">
        <div className="flex items-center gap-1.5 text-slate-900">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>Source: <strong className="font-semibold">{source}</strong></span>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1 ${getBadgeStyle(
            confidenceLevel
          )}`}
        >
          {verified ? (
            <CheckCircle className="w-3 h-3 text-emerald-600" />
          ) : (
            <HelpCircle className="w-3 h-3 text-amber-600" />
          )}
          <span>{confidenceLevel.replace('_', ' ')}</span>
        </span>
      </div>

      <div className="flex items-center gap-3 text-slate-500 flex-wrap text-[11px]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formattedDate}
        </span>
        {modelUsed && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-indigo-500" />
            Model: {modelUsed}
          </span>
        )}
      </div>

      {sha256Hash && (
        <div className="text-[10px] text-slate-400 truncate" title={`SHA256: ${sha256Hash}`}>
          Hash: <span className="text-slate-600">{sha256Hash.slice(0, 16)}...{sha256Hash.slice(-8)}</span>
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import type { MessageKey } from '../i18n/types'
import {
  Home,
  UserCheck,
  Shield,
  Search,
  Pill,
  Receipt,
  Files,
  Award,
  Users,
  ShieldAlert,
} from 'lucide-react'

interface NavItem {
  to: string
  labelKey: MessageKey
  // Plain callable avoids structural mismatch on lucide-react's propTypes
  // under exactOptionalPropertyTypes.
  icon: (props: { className: string }) => React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'navHome', icon: Home },
  { to: '/onboarding', labelKey: 'navOnboarding', icon: UserCheck },
  { to: '/insurance', labelKey: 'navInsurance', icon: Shield },
  { to: '/find-care', labelKey: 'navFindCare', icon: Search },
  { to: '/medications', labelKey: 'navMedications', icon: Pill },
  { to: '/claims', labelKey: 'navClaims', icon: Receipt },
  { to: '/documents', labelKey: 'navDocuments', icon: Files },
  { to: '/pmjay', labelKey: 'navPmjay', icon: Award },
  { to: '/profile', labelKey: 'navProfile', icon: Users },
]

export interface SidebarProps {
  onCloseMobile?: (() => void) | undefined
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { t } = useI18n()

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto">
      <div className="p-4 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
          Healthcare Hub
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Footer / Privacy & Integrity Notice */}
      <div className="mt-auto p-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            <span>Honest States Mode</span>
          </div>
          <p className="leading-relaxed">
            HealthConnect displays real connectivity states only. Zero synthetic mock data.
          </p>
        </div>
      </div>
    </aside>
  )
}

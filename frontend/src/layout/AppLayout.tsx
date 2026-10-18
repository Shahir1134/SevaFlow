import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()

  // During onboarding and landing page, hide the dashboard sidebar to provide an uncluttered conversational journey
  const isOnboardingRoute = location.pathname === '/' || location.pathname.startsWith('/onboarding')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header
        onToggleSidebar={
          !isOnboardingRoute
            ? () => setMobileSidebarOpen((prev) => !prev)
            : undefined
        }
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar: hidden during onboarding */}
        {!isOnboardingRoute && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}

        {/* Mobile Sidebar Overlay: hidden during onboarding */}
        {!isOnboardingRoute && mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-50 flex flex-col">
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 overflow-y-auto w-full ${
            isOnboardingRoute
              ? 'px-4 py-6 max-w-4xl mx-auto'
              : 'px-4 sm:px-8 py-6 max-w-7xl mx-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

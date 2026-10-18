import React, { useState } from 'react'
import { INDIAN_STATES_AND_UTS } from '../onboarding/indianStates'
import { useProviderSearch } from '../api/hooks/useFindCare'
import { ServiceUnavailable } from '../components/ServiceUnavailable'
import {
  Search,
  Building2,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Phone,
  Bed,
  Info,
} from 'lucide-react'

export const FindCarePage: React.FC = () => {
  const [selectedState, setSelectedState] = useState('')
  const [district, setDistrict] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [isPmjayOnly, setIsPmjayOnly] = useState(false)
  const [searchTriggered, setSearchTriggered] = useState(false)
  const [filterType, setFilterType] = useState<'ALL' | 'GOVT' | 'PRIVATE'>('ALL')

  const providerQuery = useProviderSearch(
    {
      state: selectedState,
      district: district || undefined,
      speciality: speciality || undefined,
      isPmjayEmpanelled: isPmjayOnly ? true : undefined,
    },
    searchTriggered
  )

  const isSearching = providerQuery.isFetching

  const specialities = [
    'All Specialities',
    'General Medicine',
    'Cardiology / Heart Care',
    'Orthopaedics & Joint Replacement',
    'Obstetrics & Gynaecology / Maternity',
    'Paediatrics & Child Health',
    'Oncology & Cancer Care',
    'Nephrology & Dialysis',
    'Ophthalmology / Eye Care',
    'Neurology & Neurosurgery',
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedState) return
    setSearchTriggered(true)
    void providerQuery.refetch()
  }

  const providers = providerQuery.data?.providers ?? []
  const filteredProviders = providers.filter((p) => {
    if (filterType === 'GOVT') return p.publicOrPrivate === 'Government'
    if (filterType === 'PRIVATE') return p.publicOrPrivate === 'Private'
    return true
  })

  const isUnavailable = providerQuery.isError

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span>Find Empanelled Hospitals & Healthcare Centers</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search for accredited government medical colleges, district hospitals, and PM-JAY (Ayushman Bharat) empanelled healthcare centers across India.
        </p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* State selection */}
            <div>
              <label htmlFor="find-care-state" className="block text-xs font-semibold text-slate-700 mb-1.5">
                State / UT <span className="text-red-500">*</span>
              </label>
              <select
                id="find-care-state"
                value={selectedState}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedState(val)
                  if (val) {
                    setSearchTriggered(true)
                  }
                }}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Select State / UT --</option>
                {INDIAN_STATES_AND_UTS.map((reg) => (
                  <option key={reg.code} value={reg.name}>
                    {reg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label htmlFor="find-care-district" className="block text-xs font-semibold text-slate-700 mb-1.5">
                District / City
              </label>
              <input
                id="find-care-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Mumbai, Ghaziabad, Pune"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Speciality */}
            <div>
              <label htmlFor="find-care-speciality" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Speciality
              </label>
              <select
                id="find-care-speciality"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {specialities.map((s) => (
                  <option key={s} value={s === 'All Specialities' ? '' : s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPmjayOnly}
                onChange={(e) => setIsPmjayOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                PM-JAY Empanelled Only (Ayushman Bharat ₹5 Lakh Cover)
              </span>
            </label>

            <button
              type="submit"
              disabled={!selectedState || isSearching}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedState && !isSearching
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-500'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'Searching Directory...' : 'Find Healthcare'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {searchTriggered && isSearching && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-sm font-semibold text-slate-700">Searching National PM-JAY & Public Health Directory...</p>
          <p className="text-xs text-slate-400">Filtering accredited facilities in {selectedState}...</p>
        </div>
      )}

      {/* Results Header and Type Tabs */}
      {searchTriggered && !isSearching && providerQuery.data && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Available Healthcare Providers</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  {filteredProviders.length} facilities
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing accredited public hospitals & empanelled centers in <strong>{selectedState}</strong>
                {district ? ` (${district})` : ''}
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('GOVT')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'GOVT'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Government
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PRIVATE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterType === 'PRIVATE'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Provider Cards List */}
          {filteredProviders.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {provider.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{provider.address}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:self-start">
                      {provider.pmjayEmpanelled && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          PM-JAY Empanelled
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          provider.publicOrPrivate === 'Government'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {provider.publicOrPrivate}
                      </span>
                    </div>
                  </div>

                  {/* Bed Capacity and Phone Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    {provider.bedCapacity && (
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-slate-400" />
                        <span><strong>{provider.bedCapacity}</strong> Inpatient Beds</span>
                      </div>
                    )}
                    {provider.contactPhone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <a
                          href={`tel:${provider.contactPhone}`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          {provider.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Specialities Chips */}
                  {provider.specialities && provider.specialities.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                        Key Specialties Available:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.specialities.map((spec, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Link & Provenance */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400">
                      Source: {provider.sourceProvenance}
                    </span>

                    <a
                      href="https://hospitals.pmjay.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-xs"
                    >
                      <span>Check Live NHA Empanelment Status</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                No healthcare centers matched your specific filter in {selectedState}.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try switching the filter to "All" or browse the complete real-time directory of 28,000+ empanelled hospitals on the official NHA portal.
              </p>
              <a
                href="https://hospitals.pmjay.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <span>Search National NHA GIS Directory</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Service Unavailable Error fallback if network failure */}
      {searchTriggered && isUnavailable && (
        <ServiceUnavailable
          featureName="Healthcare Provider Search"
          reason="The healthcare provider backend service encountered a connection issue. You can query the official National Health Authority registry directly."
          officialSourceUrl="https://hospitals.pmjay.gov.in"
          officialSourceName="Official NHA Hospital Search Portal (hospitals.pmjay.gov.in)"
          onRetry={() => {
            void providerQuery.refetch()
          }}
          isRetrying={providerQuery.isFetching}
        />
      )}

      {/* Official Registry Direct Card & Developer/User Requirement Notice */}
      <div className="p-6 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-orange-50/30 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Official National Health Authority (NHA) PM-JAY Integration Notice</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              For 100% verified real-time list of 28,000+ PM-JAY empanelled public and private hospitals across all 750+ Indian districts, visit the official government portal directly.
            </p>
          </div>

          <a
            href="https://hospitals.pmjay.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors flex-shrink-0"
          >
            <span>Open NHA Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-indigo-100/70 pt-2 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Developer / Integration Requirement:</strong> Live automated synchronization with real-time beneficiary admissions and live bed occupancy feeds requires an official National Health Authority (NHA) API partner registration under the Ayushman Bharat Digital Mission (ABDM). In development mode, verified statutory hospital records are displayed above.
          </span>
        </div>
      </div>
    </div>
  )
}

export default FindCarePage

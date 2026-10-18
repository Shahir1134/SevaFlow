import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClaimCreateSchema, type ClaimCreate } from '../types/api'
import { useClaims, useAddClaim, useSection80D } from '../api/hooks/useClaims'
import { Receipt, Plus, Calculator, CheckCircle2 } from 'lucide-react'

export const ClaimsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: claims = [], isLoading } = useClaims()
  const { data: section80D } = useSection80D()
  const addClaimMutation = useAddClaim()

  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClaimCreate>({
    resolver: zodResolver(ClaimCreateSchema),
    defaultValues: {
      claimDate: today,
      category: 'HEALTH_INSURANCE_PREMIUM',
      amountInr: 15000,
      relationship: 'Self',
    } satisfies Partial<ClaimCreate>,
  })

  const onSubmit: Parameters<typeof handleSubmit>[0] = (data) => {
    addClaimMutation.mutate(data as ClaimCreate, {
      onSuccess: () => {
        reset()
        setShowAddForm(false)
      },
    })
  }

  const formatInr = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Healthcare Expenses & Section 80D Tax Deduction</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track out-of-pocket medical bills and compute Income Tax Act Section 80D deductions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Record Medical Expense'}</span>
        </button>
      </div>

      {/* Section 80D Tax Deduction Overview Card */}
      {section80D && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-indigo-700/50 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold tracking-tight">
                Section 80D Eligible Tax Deduction (FY {section80D.financialYear})
              </h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Income Tax Act of India
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-indigo-200 block">Total 80D Deduction</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-orange-400 mt-1 block">
                {formatInr(section80D.totalDeductionInr)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Max allowable: {formatInr(section80D.maxAllowedTotalInr)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-indigo-200 block">Self & Family Premium</span>
              <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                {formatInr(section80D.selfFamilyEligibleInr)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Capped at {formatInr(section80D.selfFamilyMaxLimitInr)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-indigo-200 block">Parents Health Premium</span>
              <span className="text-xl sm:text-2xl font-bold text-white mt-1 block">
                {formatInr(section80D.parentsEligibleInr)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Capped at {formatInr(section80D.parentsMaxLimitInr)} (Senior slab)
              </span>
            </div>
          </div>

          {/* Breakdown items */}
          <div className="space-y-2 text-xs">
            <div className="text-indigo-300 font-semibold mb-1 uppercase tracking-wider text-[11px]">
              Deduction Breakdown & Sub-Limits:
            </div>
            {section80D.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-slate-200 text-xs"
              >
                <div>
                  <span className="font-medium text-white">{item.category}</span>
                  <span className="text-slate-400 text-[11px] block">{item.forWho}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-orange-300">{formatInr(item.cappedAmount)}</span>
                  <span className="text-slate-400 text-[11px] block">
                    Actual: {formatInr(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Claim Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Record New Medical Expense / Insurance Premium
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('patientName')}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.patientName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.patientName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('relationship')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Self">Self</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child (Dependent)</option>
                  <option value="Mother">Mother (Parent)</option>
                  <option value="Father">Father (Parent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="HEALTH_INSURANCE_PREMIUM">Health Insurance Premium (80D)</option>
                  <option value="PREVENTIVE_HEALTH_CHECKUP">Preventive Health Check-up (Sublimit ₹5,000)</option>
                  <option value="MEDICAL_EXPENDITURE_SENIOR">Medical Expenditure (Senior Citizen without insurance)</option>
                  <option value="HOSPITALISATION_TREATMENT">Hospitalisation Treatment</option>
                  <option value="OUTPATIENT_PHARMACY">Outpatient / Pharmacy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (₹ INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('amountInr', { valueAsNumber: true })}
                  placeholder="e.g. 20000"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.amountInr && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.amountInr.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provider / Insurer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('providerName')}
                  placeholder="e.g. Star Health, Fortis Hospital"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.providerName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.providerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Payment / Expense <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('claimDate')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.claimDate && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.claimDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addClaimMutation.isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {addClaimMutation.isPending ? 'Saving...' : 'Record Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Recorded Claims & Expenses ({claims.length})
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading expenses...</div>
        ) : claims.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">No expenses recorded yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your medical bills and insurance premiums to compute 80D tax deductions and track reimbursement status.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Record First Expense
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <div key={claim.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{claim.patientName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {claim.relationship}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Provider: <strong className="text-slate-700">{claim.providerName}</strong> • {claim.claimDate}
                    </div>
                    <span className="inline-block text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {claim.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-slate-900">
                      {formatInr(claim.amountInr)}
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Section 80D Eligible
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClaimsPage

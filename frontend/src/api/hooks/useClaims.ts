import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ServiceUnavailableError } from '../client'
import type { InsuranceClaim, ClaimCreate, Section80DSummary } from '../../types/api'

const LOCAL_STORAGE_CLAIMS_KEY = 'healthconnect_claims_local'

function getLocalClaims(): InsuranceClaim[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLAIMS_KEY)
    if (raw) return JSON.parse(raw) as InsuranceClaim[]
  } catch {
    // ignore
  }
  return []
}

function saveLocalClaims(claims: InsuranceClaim[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CLAIMS_KEY, JSON.stringify(claims))
  } catch {
    // ignore
  }
}

export function compute80DSummary(claims: InsuranceClaim[]): Section80DSummary {
  let selfFamilyPremium = 0
  let parentsPremium = 0
  let preventiveCheckup = 0

  for (const claim of claims) {
    const isParent = claim.relationship.toLowerCase().includes('parent') ||
      claim.relationship.toLowerCase().includes('mother') ||
      claim.relationship.toLowerCase().includes('father')

    if (claim.category === 'PREVENTIVE_HEALTH_CHECKUP') {
      preventiveCheckup += claim.amountInr
    } else if (isParent) {
      parentsPremium += claim.amountInr
    } else {
      selfFamilyPremium += claim.amountInr
    }
  }

  // Capped limits per Indian Income Tax Act Section 80D
  const cappedPreventive = Math.min(preventiveCheckup, 5000)
  const cappedSelfFamily = Math.min(selfFamilyPremium + (preventiveCheckup <= 5000 ? cappedPreventive : 0), 25000)
  const cappedParents = Math.min(parentsPremium, 50000)
  const totalDeduction = cappedSelfFamily + cappedParents

  return {
    financialYear: '2025-26',
    selfFamilyEligibleInr: selfFamilyPremium,
    selfFamilyMaxLimitInr: 25000,
    parentsEligibleInr: parentsPremium,
    parentsMaxLimitInr: 50000,
    preventiveCheckupClaimedInr: preventiveCheckup,
    preventiveCheckupMaxLimitInr: 5000,
    totalDeductionInr: totalDeduction,
    maxAllowedTotalInr: 75000,
    breakdown: [
      {
        category: 'Self & Dependent Family Health Insurance',
        forWho: 'Self, Spouse, Children',
        amount: selfFamilyPremium,
        cappedAmount: cappedSelfFamily,
      },
      {
        category: 'Parents Health Insurance & Medical',
        forWho: 'Parents (Senior Citizen slab up to ₹50,000)',
        amount: parentsPremium,
        cappedAmount: cappedParents,
      },
      {
        category: 'Preventive Health Check-up (sub-limit)',
        forWho: 'Family & Parents combined',
        amount: preventiveCheckup,
        cappedAmount: cappedPreventive,
      },
    ],
  }
}

export function useClaims() {
  return useQuery<InsuranceClaim[], ServiceUnavailableError>({
    queryKey: ['insurance-claims'],
    queryFn: async () => {
      try {
        return await api.get<InsuranceClaim[]>('/claims')
      } catch (err) {
        const local = getLocalClaims()
        if (local.length > 0) return local
        throw err
      }
    },
    retry: false,
  })
}

export function useAddClaim() {
  const queryClient = useQueryClient()

  return useMutation<InsuranceClaim, Error, ClaimCreate>({
    mutationFn: async (payload) => {
      const newClaim: InsuranceClaim = {
        id: `clm_${Date.now()}`,
        patientName: payload.patientName,
        relationship: payload.relationship,
        providerName: payload.providerName,
        claimDate: payload.claimDate,
        amountInr: payload.amountInr,
        category: payload.category,
        policyNumber: payload.policyNumber,
        status: 'Draft',
        taxEligible80D: true,
        taxYear: '2025-26',
        notes: payload.notes,
      }

      try {
        return await api.post<InsuranceClaim>('/claims', payload)
      } catch {
        const existing = getLocalClaims()
        saveLocalClaims([newClaim, ...existing])
        return newClaim
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insurance-claims'] })
      void queryClient.invalidateQueries({ queryKey: ['section-80d'] })
    },
  })
}

export function useSection80D() {
  return useQuery<Section80DSummary, ServiceUnavailableError>({
    queryKey: ['section-80d'],
    queryFn: async () => {
      try {
        return await api.get<Section80DSummary>('/claims/tax-deduction-80d')
      } catch {
        const localClaims = getLocalClaims()
        return compute80DSummary(localClaims)
      }
    },
  })
}

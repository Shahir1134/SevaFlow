import { useQuery } from '@tanstack/react-query'
import { api, ServiceUnavailableError } from '../client'
import type { PmjayEligibilityResult } from '../../types/api'

export function usePmjayEligibilityCheck(beneficiaryId?: string | undefined) {
  return useQuery<PmjayEligibilityResult, ServiceUnavailableError>({
    queryKey: ['pmjay-check', beneficiaryId],
    queryFn: async () => {
      // Direct call to backend PMJAY integration
      return api.get<PmjayEligibilityResult>(`/pmjay/verify?id=${encodeURIComponent(beneficiaryId ?? '')}`)
    },
    enabled: Boolean(beneficiaryId && beneficiaryId.length > 2),
    retry: 1,
  })
}

export function usePmjayHospitals(state?: string | undefined, district?: string | undefined) {
  return useQuery<unknown[], ServiceUnavailableError>({
    queryKey: ['pmjay-hospitals', state, district],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (state) params.set('state', state)
      if (district) params.set('district', district)
      return api.get<unknown[]>(`/pmjay/hospitals?${params.toString()}`)
    },
    enabled: Boolean(state),
    retry: 1,
  })
}

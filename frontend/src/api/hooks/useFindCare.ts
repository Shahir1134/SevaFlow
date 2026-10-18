import { useQuery } from '@tanstack/react-query'
import { api, ServiceUnavailableError } from '../client'
import type { FindCareResult, ProviderSearchParams } from '../../types/api'

export function useProviderSearch(params: ProviderSearchParams, enabled = true) {
  const queryParams = new URLSearchParams()
  if (params.state) queryParams.set('state', params.state)
  if (params.district) queryParams.set('district', params.district)
  if (params.speciality) queryParams.set('speciality', params.speciality)
  if (params.isPmjayEmpanelled !== undefined) {
    queryParams.set('pmjay', String(params.isPmjayEmpanelled))
  }
  if (params.query) queryParams.set('q', params.query)

  return useQuery<FindCareResult, ServiceUnavailableError>({
    queryKey: ['providers', params],
    queryFn: async () => {
      return api.get<FindCareResult>(`/care/providers?${queryParams.toString()}`)
    },
    enabled: enabled && Boolean(params.state),
    retry: 1,
  })
}

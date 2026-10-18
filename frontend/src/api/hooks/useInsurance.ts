import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ServiceUnavailableError } from '../client'
import type { InsurancePolicy, PolicyCoverageQuery, PolicyCoverageResult } from '../../types/api'

export function usePolicies() {
  return useQuery<InsurancePolicy[], ServiceUnavailableError>({
    queryKey: ['insurance-policies'],
    queryFn: async () => {
      return api.get<InsurancePolicy[]>('/insurance/policies')
    },
    retry: 1,
  })
}

export function usePolicyQuery() {
  return useMutation<PolicyCoverageResult, ServiceUnavailableError, PolicyCoverageQuery>({
    mutationFn: async (payload) => {
      return api.post<PolicyCoverageResult>('/insurance/coverage/query', payload)
    },
  })
}

export function usePolicyUpload() {
  const queryClient = useQueryClient()

  return useMutation<InsurancePolicy, ServiceUnavailableError, FormData>({
    mutationFn: async (formData) => {
      return api.post<InsurancePolicy>('/insurance/policies/upload', formData)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insurance-policies'] })
    },
  })
}

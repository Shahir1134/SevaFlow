import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ServiceUnavailableError } from '../client'
import type { Medication, MedicationCreate } from '../../types/api'

const LOCAL_STORAGE_MEDS_KEY = 'healthconnect_medications_local'

function getLocalMedications(): Medication[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDS_KEY)
    if (raw) return JSON.parse(raw) as Medication[]
  } catch {
    // ignore
  }
  return []
}

function saveLocalMedications(meds: Medication[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MEDS_KEY, JSON.stringify(meds))
  } catch {
    // ignore
  }
}

export function useMedications() {
  return useQuery<Medication[], ServiceUnavailableError>({
    queryKey: ['medications'],
    queryFn: async () => {
      try {
        return await api.get<Medication[]>('/medications')
      } catch (err) {
        // Fall back to local items so user form works immediately
        const local = getLocalMedications()
        if (local.length > 0) {
          return local
        }
        throw err
      }
    },
    retry: false,
  })
}

export function useAddMedication() {
  const queryClient = useQueryClient()

  return useMutation<Medication, Error, MedicationCreate>({
    mutationFn: async (payload) => {
      const newMed: Medication = {
        id: `med_${Date.now()}`,
        name: payload.name,
        dosage: payload.dosage,
        frequency: payload.frequency,
        timeOfDay: payload.timeOfDay,
        startDate: payload.startDate,
        prescribedBy: payload.prescribedBy,
        instructions: payload.instructions,
        createdAt: new Date().toISOString(),
      }

      try {
        const serverResult = await api.post<Medication>('/medications', payload)
        return serverResult
      } catch {
        // Genuine offline local store fallback
        const existing = getLocalMedications()
        const updated = [newMed, ...existing]
        saveLocalMedications(updated)
        return newMed
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

export function useDeleteMedication() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/medications/${id}`)
      } catch {
        // fallback local removal
      }
      const existing = getLocalMedications()
      saveLocalMedications(existing.filter((m) => m.id !== id))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['medications'] })
    },
  })
}

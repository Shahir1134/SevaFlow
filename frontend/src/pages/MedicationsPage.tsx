import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MedicationCreateSchema, type MedicationCreate } from '../types/api'
import { useMedications, useAddMedication, useDeleteMedication } from '../api/hooks/useMedications'
import { Pill, Plus, Trash2, Calendar, Clock, User } from 'lucide-react'

export const MedicationsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  const { data: medications = [], isLoading } = useMedications()
  const addMedicationMutation = useAddMedication()
  const deleteMedicationMutation = useDeleteMedication()

  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicationCreate>({
    resolver: zodResolver(MedicationCreateSchema),
    defaultValues: {
      startDate: today,
      frequency: 'Once daily',
      timeOfDay: 'Morning after food',
    } satisfies Partial<MedicationCreate>,
  })

  const onSubmit: Parameters<typeof handleSubmit>[0] = (data) => {
    addMedicationMutation.mutate(data as MedicationCreate, {
      onSuccess: () => {
        reset()
        setShowAddForm(false)
      },
    })
  }

  const filteredMeds = medications.filter((m) =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-indigo-600" />
            <span>Medications & Prescriptions</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Maintain your family's active medications, dosages, and schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add Medication'}</span>
        </button>
      </div>

      {/* Manual Entry Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Add New Medication Entry
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="e.g. Metformin, Amlodipine"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dosage / Strength <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('dosage')}
                  placeholder="e.g. 500mg, 5mg, 1 tablet"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.dosage && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.dosage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('frequency')}
                  placeholder="e.g. Once daily, Twice daily"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.frequency && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.frequency.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Time of Day & Instructions <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('timeOfDay')}
                  placeholder="e.g. Morning after breakfast"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.timeOfDay && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.timeOfDay.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prescribed By (Doctor/Hospital)
                </label>
                <input
                  type="text"
                  {...register('prescribedBy')}
                  placeholder="e.g. Dr. Sharma, Max Hospital"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                disabled={addMedicationMutation.isPending}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {addMedicationMutation.isPending ? 'Saving...' : 'Save Medication'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medication List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Active Medications ({filteredMeds.length})
          </h2>
          {medications.length > 0 && (
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search medications..."
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading medications...</div>
        ) : filteredMeds.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">No medications added yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your current regular prescriptions to keep track of dosages and reminders.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Add First Medication
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeds.map((med) => (
              <div
                key={med.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{med.name}</h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                      {med.dosage}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteMedicationMutation.mutate(med.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Remove medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{med.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Since {med.startDate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                  <span className="font-medium text-slate-500 block text-[11px]">Timing:</span>
                  {med.timeOfDay}
                </div>

                {med.prescribedBy && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Dr: {med.prescribedBy}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicationsPage

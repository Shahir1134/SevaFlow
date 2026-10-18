import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Trash2 } from 'lucide-react'

export interface FamilyMember {
  id: string
  name: string
  relationship: 'Myself' | 'Spouse' | 'Child' | 'Parent' | 'Other'
  age: number
  gender: string
  conditions: string[]
}

const LOCAL_STORAGE_FAMILY_KEY = 'healthconnect_family_members'

export const ProfilePage: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAMILY_KEY)
      if (saved) return JSON.parse(saved) as FamilyMember[]
    } catch {
      // ignore
    }

    // Default primary profile derived from onboarding session if present
    try {
      const rawOnboarding = sessionStorage.getItem('healthconnect_onboarding_state_v1')
      if (rawOnboarding) {
        const parsed = JSON.parse(rawOnboarding)
        const ans = parsed?.state?.answers
        if (ans && ans['PROFILE_OWNER']) {
          return [
            {
              id: 'primary_member',
              name: 'Primary Account Holder',
              relationship: ans['PROFILE_OWNER'] as FamilyMember['relationship'],
              age: Number(ans['AGE_EXACT']) || 35,
              gender: (ans['GENDER'] as string) || 'Not specified',
              conditions: Array.isArray(ans['HEALTH_CONDITIONS']) ? ans['HEALTH_CONDITIONS'] : [],
            },
          ]
        }
      }
    } catch {
      // ignore
    }

    return [
      {
        id: 'default_primary',
        name: 'Primary Profile (Myself)',
        relationship: 'Myself',
        age: 32,
        gender: 'Not specified',
        conditions: [],
      },
    ]
  })

  const [showAddMember, setShowAddMember] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('Spouse')
  const [age, setAge] = useState<number>(30)
  const [gender, setGender] = useState('Female')
  const [conditionInput, setConditionInput] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAMILY_KEY, JSON.stringify(members))
    } catch {
      // ignore
    }
  }, [members])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newMember: FamilyMember = {
      id: `fam_${Date.now()}`,
      name: name.trim(),
      relationship,
      age: Number(age) || 0,
      gender,
      conditions: conditionInput.trim() ? [conditionInput.trim()] : [],
    }

    setMembers((prev) => [...prev, newMember])
    setName('')
    setConditionInput('')
    setShowAddMember(false)
  }

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Family Health Profiles</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage profiles and medical histories for your family members in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddMember((prev) => !prev)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddMember ? 'Cancel' : 'Add Family Member'}</span>
        </button>
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Add New Family Member</h2>

          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as FamilyMember['relationship'])}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (Completed Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosed Health Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  placeholder="e.g. Asthma, High blood pressure"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
                  {member.relationship} • {member.age} yrs • {member.gender}
                </span>
              </div>

              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Remove family member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 block mb-1">
                Known Conditions:
              </span>
              {member.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {member.conditions.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400">No specific conditions recorded</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProfilePage

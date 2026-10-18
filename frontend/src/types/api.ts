import { z } from 'zod'

// Service Availability Status
export type ServiceStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'DEGRADED'

export interface ServiceHealth {
  service: string
  status: ServiceStatus
  message?: string | undefined
  lastChecked: string
  officialUrl?: string | undefined
}

// Authentication
export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const RegisterRequestSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export interface AuthUser {
  id: string
  email: string
  fullName: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  user: AuthUser
}

// Insurance & Coverage
export const PolicyCoverageQuerySchema = z.object({
  documentId: z.string().optional(),
  policyId: z.string().optional(),
  queryText: z.string().min(3, 'Query must be at least 3 characters'),
  category: z.string().optional(),
})
export type PolicyCoverageQuery = z.infer<typeof PolicyCoverageQuerySchema>

export interface CoverageClauseMatch {
  sectionTitle: string
  content: string
  pageNumber?: number | undefined
  confidence: number
  covered: boolean
  copayPercent?: number | undefined
  waitingPeriodMonths?: number | undefined
  sublimitAmountInr?: number | undefined
}

export interface PolicyCoverageResult {
  query: string
  coveredStatus: 'COVERED' | 'NOT_COVERED' | 'CONDITIONAL' | 'INSUFFICIENT_DATA'
  confidence: number
  explanation: string
  matchedClauses: CoverageClauseMatch[]
  dataNotice: string
  provenance: {
    source: string
    retrievedAt: string
    modelUsed: string
  }
}

export interface InsurancePolicy {
  id: string
  policyNumber: string
  insurerName: string
  planName: string
  sumInsuredInr: number
  startDate: string
  expiryDate: string
  insuredMembers: string[]
  uploadedAt: string
  rawDocumentUrl?: string | undefined
}

// Healthcare Providers / Find Care
export const ProviderSearchParamsSchema = z.object({
  state: z.string().min(1, 'State is required'),
  district: z.string().optional(),
  speciality: z.string().optional(),
  isPmjayEmpanelled: z.boolean().optional(),
  query: z.string().optional(),
})
export type ProviderSearchParams = z.infer<typeof ProviderSearchParamsSchema>

export interface HealthcareProvider {
  id: string
  name: string
  category: 'Hospital' | 'Clinic' | 'Diagnostic Center' | 'Pharmacy'
  state: string
  district: string
  address: string
  pincode?: string | undefined
  contactPhone?: string | undefined
  pmjayEmpanelled: boolean
  specialities: string[]
  bedCapacity?: number | undefined
  publicOrPrivate: 'Government' | 'Private'
  sourceProvenance: string
}

export interface FindCareResult {
  providers: HealthcareProvider[]
  totalCount: number
  isLiveRegistryConnected: boolean
  officialSourceNotice?: string | undefined
  officialSourceUrl?: string | undefined
}

// Medications
export const MedicationCreateSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., Twice daily)'),
  timeOfDay: z.string().min(1, 'Time of day is required (e.g., Morning after food)'),
  startDate: z.string().min(1, 'Start date is required'),
  prescribedBy: z.string().optional(),
  instructions: z.string().optional(),
})
export type MedicationCreate = z.infer<typeof MedicationCreateSchema>

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  timeOfDay: string
  startDate: string
  prescribedBy?: string | undefined
  instructions?: string | undefined
  createdAt: string
}

// Claims & Section 80D Tax Deduction
export const ClaimCategoryEnum = z.enum([
  'HEALTH_INSURANCE_PREMIUM',
  'PREVENTIVE_HEALTH_CHECKUP',
  'MEDICAL_EXPENDITURE_SENIOR',
  'HOSPITALISATION_TREATMENT',
  'OUTPATIENT_PHARMACY',
])
export type ClaimCategory = z.infer<typeof ClaimCategoryEnum>

export const ClaimCreateSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  providerName: z.string().min(1, 'Provider or hospital name is required'),
  claimDate: z.string().min(1, 'Date is required'),
  amountInr: z.number().min(1, 'Amount must be greater than 0'),
  category: ClaimCategoryEnum,
  policyNumber: z.string().optional(),
  notes: z.string().optional(),
})
export type ClaimCreate = z.infer<typeof ClaimCreateSchema>

export interface InsuranceClaim {
  id: string
  patientName: string
  relationship: string
  providerName: string
  claimDate: string
  amountInr: number
  category: ClaimCategory
  policyNumber?: string | undefined
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Settled' | 'Rejected'
  taxEligible80D: boolean
  taxYear: string
  notes?: string | undefined
}

export interface Section80DSummary {
  financialYear: string
  selfFamilyEligibleInr: number
  selfFamilyMaxLimitInr: number
  parentsEligibleInr: number
  parentsMaxLimitInr: number
  preventiveCheckupClaimedInr: number
  preventiveCheckupMaxLimitInr: number
  totalDeductionInr: number
  maxAllowedTotalInr: number
  breakdown: Array<{
    category: string
    forWho: string
    amount: number
    cappedAmount: number
  }>
}

// Documents
export interface DocumentProvenance {
  sourceType: 'USER_UPLOAD' | 'HOSPITAL_PORTAL' | 'INSURER_API'
  uploadedAt: string
  sha256Hash: string
  confidenceScore: number
  verified: boolean
}

export interface ClinicalInsightMedication {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

export interface ClinicalLabFinding {
  testName: string
  result: string
  unit?: string
  referenceRange?: string
  isAbnormal?: boolean
}

export interface ClinicalInsights {
  patient_name?: string
  patient_age?: string
  patient_gender?: string
  health_issue?: string
  symptoms?: string[]
  medications?: ClinicalInsightMedication[]
  doctor_name?: string
  clinic_or_hospital?: string
  report_date?: string
  lab_findings?: ClinicalLabFinding[]
  key_advice?: string[]
  summary?: string
}

export interface DocumentItem {
  id: string
  fileName: string
  fileSizeBytes: number
  mimeType: string
  docType: 'Insurance Policy' | 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Tax Invoice' | string
  patientName?: string | undefined
  uploadedAt: string
  sha256Hash?: string | undefined
  provenance: DocumentProvenance
  url?: string | undefined
  downloadUrl?: string | undefined
  aiSummary?: string | undefined
  clinicalInsights?: ClinicalInsights | undefined
  status?: string | undefined
}

export interface DocumentUploadResponse {
  id: string
  fileName: string
  fileSizeBytes: number
  mimeType: string
  uploadedAt: string
  sha256Hash: string
  status: 'PROCESSED' | 'QUEUED'
  patientName?: string | undefined
  aiSummary?: string | undefined
  clinicalInsights?: ClinicalInsights | undefined
}

// PM-JAY Verification
export interface PmjayEligibilityResult {
  isEmpanelled: boolean
  state: string
  schemeName: string
  annualCoverageLimitInr: number
  verificationStatus: 'UNAVAILABLE_OFFICIAL_REGISTRY_REQUIRED' | 'SELF_REPORTED' | 'VERIFIED'
  notice: string
  officialPortalUrl: string
}

// Generic API Error
export interface ApiError {
  status: number
  code: string
  message: string
  details?: Record<string, unknown> | undefined
  isServiceUnavailable?: boolean | undefined
}

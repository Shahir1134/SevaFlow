import React, { useState } from 'react'
import { FileUpload, type UploadedFileInfo } from '../components/FileUpload'
import { ProvenanceDisplay } from '../components/ProvenanceDisplay'
import {
  useDocuments,
  useUploadDocument,
  useSyncDocumentMedications,
  useDeleteDocument,
  deduplicateDocuments,
} from '../api/hooks/useDocuments'
import type { DocumentItem } from '../types/api'
import {
  Files,
  FileText,
  Filter,
  Download,
  Trash2,
  User,
  Stethoscope,
  Pill,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  Search,
  FlaskConical,
  Building,
} from 'lucide-react'

export const DocumentsPage: React.FC = () => {
  const [docType, setDocType] = useState<DocumentItem['docType']>('Prescription')
  const [patientName, setPatientName] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null)
  const [syncedDocIds, setSyncedDocIds] = useState<Record<string, boolean>>({})

  const { data: documents = [], isLoading } = useDocuments()
  const uploadDocMutation = useUploadDocument()
  const syncMedsMutation = useSyncDocumentMedications()
  const deleteDocMutation = useDeleteDocument()

  const handleFileSelected = (info: UploadedFileInfo) => {
    setSelectedFile(info)
    setUploadSuccessMsg(null)
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setUploadSuccessMsg(null)
  }

  const handleAnalyzeAndUpload = async () => {
    if (!selectedFile) return
    try {
      const result = await uploadDocMutation.mutateAsync({
        file: selectedFile.file,
        docType,
        patientName: patientName.trim() || undefined,
        sha256Hash: selectedFile.sha256Hash,
      })
      setUploadSuccessMsg(
        `Document "${result.fileName}" successfully analyzed by AI and securely stored in your vault!`
      )
      setSelectedFile(null)
      // Auto-clear success message after 7 seconds
      setTimeout(() => setUploadSuccessMsg(null), 7000)
    } catch (err: any) {
      console.error('Document upload error:', err)
    }
  }

  const handleSyncMedications = async (docId: string) => {
    try {
      await syncMedsMutation.mutateAsync(docId)
      setSyncedDocIds((prev) => ({ ...prev, [docId]: true }))
    } catch (err) {
      console.error('Medication sync error:', err)
    }
  }

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (window.confirm(`Are you sure you want to remove "${docName}" from your vault?`)) {
      try {
        await deleteDocMutation.mutateAsync(docId)
      } catch (err) {
        console.error('Delete error:', err)
      }
    }
  }

  const uniqueDocs = deduplicateDocuments(documents)
  const filteredDocs = uniqueDocs.filter((doc) => {
    // Type filter
    if (typeFilter !== 'ALL' && doc.docType.toLowerCase() !== typeFilter.toLowerCase()) {
      return false
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const inFileName = doc.fileName.toLowerCase().includes(q)
      const inPatient = (doc.patientName || '').toLowerCase().includes(q)
      const inIssue = (doc.clinicalInsights?.health_issue || '').toLowerCase().includes(q)
      const inMeds = (doc.clinicalInsights?.medications || []).some((m) =>
        m.name.toLowerCase().includes(q)
      )
      const inSummary = (doc.aiSummary || '').toLowerCase().includes(q)
      return inFileName || inPatient || inIssue || inMeds || inSummary
    }
    return true
  })

  const getDocTypeBadgeStyle = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('prescription')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    if (t.includes('lab') || t.includes('diagnostic')) {
      return 'bg-purple-50 text-purple-700 border-purple-200'
    }
    if (t.includes('discharge') || t.includes('summary')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (t.includes('policy') || t.includes('insurance')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            AI-Powered Clinical Health Vault & ABDM Provenance
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Files className="w-7 h-7 text-indigo-600" />
            <span>Health Documents & Records Vault</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Upload prescriptions, diagnostic lab reports, discharge summaries, or policies.
            Our clinical AI extracts the patient's identity, diagnosed medical conditions, and prescribed
            medications with 1-click sync to your active medications tracker.
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Upload & Analyze Medical Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports PDF, PNG, JPG scans up to 20MB. AI automatically reads and structures all details.
            </p>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Document Category
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentItem['docType'])}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 bg-white font-medium text-slate-800 shadow-2xs"
            >
              <option value="Prescription">Prescription (Doctor Rx & Medications)</option>
              <option value="Lab Report">Lab / Diagnostic Report (Blood, Pathology, Radiology)</option>
              <option value="Discharge Summary">Clinical Description / Discharge Summary</option>
              <option value="Insurance Policy">Health Insurance Policy / Prospectus</option>
              <option value="Tax Invoice">Tax Invoice / Pharmacy Receipt (Section 80D)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Patient / Member Name (Optional)
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Jordan Doe, Priya Sharma, or Self"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-medium text-slate-800 shadow-2xs"
            />
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
              <span>Quick:</span>
              <button
                type="button"
                onClick={() => setPatientName('Jordan Doe')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Jordan Doe
              </button>
              <button
                type="button"
                onClick={() => setPatientName('Self')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
              >
                Self
              </button>
            </div>
          </div>
        </div>

        {/* File Dropzone */}
        <FileUpload
          label="Select document to calculate SHA-256 & analyze with AI"
          onFileSelect={handleFileSelected}
          onClear={handleClearFile}
        />

        {/* Action Button & Live Progress */}
        {selectedFile && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Ready to analyze: <span className="text-indigo-700">{selectedFile.name}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Category: <strong>{docType}</strong> • Patient: <strong>{patientName || 'Auto-detect via AI'}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeAndUpload}
              disabled={uploadDocMutation.isPending}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {uploadDocMutation.isPending ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>AI Analyzing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Save to Vault</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Pending Status */}
        {uploadDocMutation.isPending && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
              <Activity className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Analyzing Document Content with Clinical AI...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-indigo-700 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Provenance Hash Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span>2. Identifying Patient & Issue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Extracting Medicines & Regimen</span>
              </div>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {uploadSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-950 text-sm">Document Saved & Analyzed Successfully!</p>
              <p className="mt-0.5 text-emerald-800">{uploadSuccessMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stored Documents Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Stored Documents ({filteredDocs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored in your clinical vault with tamper-evident provenance.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, medication, or diagnosis..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Prescription">Prescriptions</option>
                <option value="Lab Report">Lab Reports</option>
                <option value="Discharge Summary">Discharge Summaries</option>
                <option value="Insurance Policy">Insurance Policies</option>
                <option value="Tax Invoice">Tax Invoices</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="font-semibold text-slate-700">Loading your clinical vault documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 rounded-3xl border-2 border-dashed border-slate-300 bg-white text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery || typeFilter !== 'ALL'
                ? 'No documents match your active filters. Try resetting the search or category filter.'
                : 'Upload a prescription, diagnostic lab report, or discharge summary above. Our clinical AI will extract the patient details, diagnosed issues, and prescribed medicines automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredDocs.map((doc) => {
              const insights = doc.clinicalInsights
              const isPrescription = doc.docType.toLowerCase().includes('prescription')
              const isLab = doc.docType.toLowerCase().includes('lab')
              const hasMedications = (insights?.medications && insights.medications.length > 0) || false
              const isSynced = syncedDocIds[doc.id]

              const hasPatient = Boolean(doc.patientName || insights?.patient_name)
              const hasIssue = Boolean(insights?.health_issue)
              const hasDoctor = Boolean(insights?.doctor_name || insights?.clinic_or_hospital)
              const hasClinicalDetails = hasPatient || hasIssue || hasDoctor

              return (
                <div
                  key={doc.id}
                  className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Top Bar: Title, Category Badge & Actions */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        {isPrescription ? (
                          <Pill className="w-5 h-5" />
                        ) : isLab ? (
                          <FlaskConical className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{doc.fileName}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getDocTypeBadgeStyle(
                              doc.docType
                            )}`}
                          >
                            {doc.docType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Download & Delete */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={doc.downloadUrl || `http://localhost:8000/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        download={doc.fileName}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id, doc.fileName)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clinical AI Intelligence Breakdown Card */}
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Core Evidence Pillars - Rendered only when present in document */}
                    {hasClinicalDetails ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Who the person is */}
                        {hasPatient && (
                          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              <User className="w-4 h-4 text-indigo-600" />
                              <span>Patient / Person</span>
                            </div>
                            <p className="text-base font-extrabold text-slate-900 pt-0.5">
                              {doc.patientName || insights?.patient_name}
                            </p>
                            {(insights?.patient_age || insights?.patient_gender) && (
                              <p className="text-xs text-slate-600">
                                {insights.patient_age ? `${insights.patient_age}` : ''}
                                {insights.patient_age && insights.patient_gender ? ' • ' : ''}
                                {insights.patient_gender ? `${insights.patient_gender}` : ''}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 2. What issue the person is facing */}
                        {hasIssue && (
                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                              <Stethoscope className="w-4 h-4 text-amber-700" />
                              <span>Diagnosed Health Issue</span>
                            </div>
                            <p className="text-sm font-extrabold text-amber-950 pt-0.5 leading-snug">
                              {insights!.health_issue}
                            </p>
                            {insights?.symptoms && insights.symptoms.length > 0 && (
                              <div className="text-[11px] text-amber-800 flex flex-wrap gap-1 pt-1">
                                {insights.symptoms.slice(0, 3).map((s, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded-md bg-amber-100/70">
                                    • {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Doctor / Clinic */}
                        {hasDoctor && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                              <Building className="w-4 h-4 text-slate-600" />
                              <span>Doctor / Facility</span>
                            </div>
                            <p className="text-sm font-extrabold text-slate-900 pt-0.5">
                              {insights?.doctor_name || insights?.clinic_or_hospital}
                            </p>
                            {insights?.report_date && (
                              <p className="text-xs text-slate-500">
                                Consulted on: {insights.report_date}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                        <p className="font-bold text-slate-800">
                          {doc.docType}: {doc.fileName}
                        </p>
                        <p className="text-slate-500">
                          Uploaded document archived in vault with tamper-evident provenance.
                        </p>
                      </div>
                    )}

                    {/* 3. What medicine is being given to the person */}
                    {hasMedications && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Pill className="w-5 h-5 text-emerald-700" />
                            <h4 className="text-sm font-bold text-emerald-950">
                              Prescribed Medications ({insights!.medications!.length})
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSyncMedications(doc.id)}
                            disabled={syncMedsMutation.isPending || isSynced}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                              isSynced
                                ? 'bg-emerald-600 text-white cursor-default'
                                : 'bg-white hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300'
                            }`}
                          >
                            {isSynced ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Synced to Active Medications</span>
                              </>
                            ) : syncMedsMutation.isPending ? (
                              <>
                                <Activity className="w-3.5 h-3.5 animate-spin" />
                                <span>Syncing...</span>
                              </>
                            ) : (
                              <>
                                <Pill className="w-3.5 h-3.5" />
                                <span>Add to My Medications Tracker</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Medications Table / Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {insights!.medications!.map((med, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  {med.name}
                                </span>
                                {med.dosage && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                    {med.dosage}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-slate-600 space-y-0.5">
                                {med.frequency && (
                                  <p>
                                    <strong className="text-slate-700">Frequency:</strong> {med.frequency}
                                  </p>
                                )}
                                {med.duration && (
                                  <p>
                                    <strong className="text-slate-700">Duration:</strong> {med.duration}
                                  </p>
                                )}
                                {med.instructions && med.instructions !== med.frequency && (
                                  <p className="text-slate-500 italic text-[11px]">
                                    Note: {med.instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lab Findings if present */}
                    {insights?.lab_findings && insights.lab_findings.length > 0 && (
                      <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-purple-700" />
                          <h4 className="text-sm font-bold text-purple-950">
                            Extracted Diagnostic Findings ({insights.lab_findings.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {insights.lab_findings.map((f, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-white border border-purple-200 shadow-2xs">
                              <p className="text-xs font-semibold text-slate-700">{f.testName}</p>
                              <p className="text-sm font-black text-slate-900 mt-0.5">
                                {f.result} {f.unit}
                              </p>
                              {f.referenceRange && (
                                <p className="text-[11px] text-slate-500">Ref: {f.referenceRange}</p>
                              )}
                              {f.isAbnormal && (
                                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  Abnormal
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Clinical Summary & Advice */}
                    {doc.aiSummary && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Clinical Overview</span>
                        </div>
                        <p className="leading-relaxed text-slate-600">{doc.aiSummary}</p>
                        {insights?.key_advice && insights.key_advice.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-1">
                            <span className="font-semibold text-slate-800 text-[11px]">
                              Physician Advice & Precautions:
                            </span>
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1">
                              {insights.key_advice.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Provenance Block */}
                    <div className="pt-2">
                      <ProvenanceDisplay
                        source={doc.provenance.sourceType}
                        retrievedAt={doc.provenance.uploadedAt}
                        sha256Hash={doc.provenance.sha256Hash}
                        confidenceLevel="USER_REPORTED"
                        verified={doc.provenance.verified}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentsPage

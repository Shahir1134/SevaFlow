import React, { useState } from 'react'
import { FileUpload, type UploadedFileInfo } from '../components/FileUpload'
import { ConsentGate } from '../components/ConsentGate'
import { DataNotice } from '../components/DataNotice'
import { ServiceUnavailable } from '../components/ServiceUnavailable'
import { ProvenanceDisplay } from '../components/ProvenanceDisplay'
import { usePolicyQuery } from '../api/hooks/useInsurance'
import { api } from '../api/client'
import { useI18n } from '../i18n/useI18n'
import { Shield, Search, Send, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react'

interface IndexedPolicyDoc {
  id: string
  name: string
  sizeBytes: number
  sha256Hash: string
  totalPages: number
  chunksCount: number
}

export const InsurancePage: React.FC = () => {
  const { t } = useI18n()
  const [queryText, setQueryText] = useState('')
  const [indexedDoc, setIndexedDoc] = useState<IndexedPolicyDoc | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [consentGiven, setConsentGiven] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')

  const policyQueryMutation = usePolicyQuery()

  const sampleQueries = [
    'Is cataract surgery covered and what is the sublimit?',
    'What is the waiting period for pre-existing diabetes or hypertension?',
    'Does this policy cover knee injury or accidental hospitalization?',
    'Are modern treatments like robotic surgery and stem cell therapy covered?',
    'What are the room rent capping limits?',
  ]

  const handleFileSelect = async (info: UploadedFileInfo) => {
    setIsUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', info.file)
      formData.append('document_type', 'policy')

      const res = await api.post<{
        id: string
        file_name: string
        file_size: number
        total_pages?: number
        chunks_count?: number
        message?: string
      }>('/documents/upload', formData)

      setIndexedDoc({
        id: res.id,
        name: res.file_name,
        sizeBytes: res.file_size,
        sha256Hash: info.sha256Hash,
        totalPages: res.total_pages || 1,
        chunksCount: res.chunks_count || 1,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload and parse policy document.'
      setUploadError(msg)
      setIndexedDoc(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearDoc = () => {
    setIndexedDoc(null)
    setUploadError(null)
  }

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryText.trim() || !consentGiven) return

    policyQueryMutation.mutate({
      documentId: indexedDoc?.id,
      queryText: queryText.trim(),
      policyId: policyNumber || undefined,
    })
  }

  const result = policyQueryMutation.data
  const isUnavailable =
    policyQueryMutation.isError && policyQueryMutation.error?.isServiceUnavailable

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          <span>Health Insurance Policy & Coverage Analysis</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload your insurance policy document or query coverage terms with explicit consent and AI-powered clause retrieval.
        </p>
      </div>

      <DataNotice
        customMessage="Insurance policy analysis uses natural language models to extract clauses. It does not replace insurer dispute mechanisms or binding contract documents."
      />

      {/* Step 1: Policy Document Upload */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            1. Upload Policy Document (RAG Grounding)
          </h2>
          <span className="text-xs text-slate-500">PDF, PNG, JPG, TXT up to 20MB</span>
        </div>

        {!indexedDoc ? (
          <FileUpload
            label="Select or drag your health insurance policy schedule / wording"
            onFileSelect={handleFileSelect}
            onClear={handleClearDoc}
            disabled={isUploading}
          />
        ) : (
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {indexedDoc.name}
                  </p>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    Indexed & Ready for Q&A
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-mono">
                  <span>{indexedDoc.totalPages} page(s)</span>
                  <span>•</span>
                  <span>{indexedDoc.chunksCount} clauses indexed</span>
                  <span>•</span>
                  <span>SHA256: {indexedDoc.sha256Hash.slice(0, 10)}...</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearDoc}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Remove document and upload another"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isUploading && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs text-indigo-700">
            <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full flex-shrink-0" />
            <span>Parsing policy clauses, extracting text, and indexing for RAG retrieval...</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Policy / Member Number (Optional)
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g. POL-987654321"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Coverage Query Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            2. Ask About Your Coverage
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {indexedDoc ? `Target: ${indexedDoc.name}` : 'Target: Standard IRDAI Registry'}
          </span>
        </div>

        {/* Sample questions */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-2">
            Sample questions:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQueryText(q)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-700 transition-colors text-left cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmitQuery} className="space-y-4">
          <div>
            <label htmlFor="coverage-query-input" className="block text-xs font-medium text-slate-700 mb-1">
              Your Question:
            </label>
            <div className="relative">
              <input
                id="coverage-query-input"
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="e.g., Does this policy cover knee injury or accidental hospitalization?"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          <ConsentGate
            checked={consentGiven}
            onChange={setConsentGiven}
            label="I grant explicit consent to parse my uploaded policy clauses and query text for health coverage analysis."
          />

          <button
            type="submit"
            disabled={!queryText.trim() || !consentGiven || policyQueryMutation.isPending}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              queryText.trim() && consentGiven && !policyQueryMutation.isPending
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm ring-1 ring-indigo-500'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{policyQueryMutation.isPending ? t('loading') : 'Analyze Coverage'}</span>
          </button>
        </form>
      </div>

      {/* Query Result or Honest Service Unavailable Error */}
      {isUnavailable && (
        <ServiceUnavailable
          featureName="Policy RAG Query Service"
          reason="The backend policy analysis and embedding service is currently offline or unreachable. No synthetic answers are shown."
          officialSourceUrl="https://irdai.gov.in"
          officialSourceName="Insurance Regulatory and Development Authority of India (IRDAI)"
          onRetry={() => {
            if (queryText.trim() && consentGiven) {
              policyQueryMutation.mutate({
                documentId: indexedDoc?.id,
                queryText: queryText.trim(),
                policyId: policyNumber || undefined,
              })
            }
          }}
          isRetrying={policyQueryMutation.isPending}
        />
      )}

      {/* Real Result Display if API returned data */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900">Query Analysis Result</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.coveredStatus === 'COVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : result.coveredStatus === 'NOT_COVERED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {result.coveredStatus.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {result.explanation}
          </p>

          {/* Matched Clauses */}
          {result.matchedClauses && result.matchedClauses.length > 0 ? (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Relevant Policy Clauses:
              </span>
              {result.matchedClauses.map((clause, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{clause.sectionTitle}</span>
                    {clause.pageNumber && (
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        Page {clause.pageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{clause.content}</p>
                  {(clause.waitingPeriodMonths || clause.sublimitAmountInr || clause.copayPercent) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {clause.waitingPeriodMonths && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                          Waiting Period: {clause.waitingPeriodMonths} months
                        </span>
                      )}
                      {clause.sublimitAmountInr && (
                        <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                          Sub-limit: ₹{clause.sublimitAmountInr.toLocaleString('en-IN')}
                        </span>
                      )}
                      {clause.copayPercent !== undefined && clause.copayPercent > 0 && (
                        <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded">
                          Co-pay: {clause.copayPercent}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
              No matching clause was found for this condition in the uploaded document. If this is an excluded treatment or requires a rider, it may not be payable.
            </div>
          )}

          <ProvenanceDisplay
            source={result.provenance.source}
            retrievedAt={result.provenance.retrievedAt}
            modelUsed={result.provenance.modelUsed}
            confidenceLevel={result.confidence > 0.8 ? 'HIGH' : 'MEDIUM'}
            verified={false}
          />
        </div>
      )}
    </div>
  )
}

export default InsurancePage

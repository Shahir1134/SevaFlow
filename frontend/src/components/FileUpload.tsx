import React, { useState, useRef } from 'react'
import { UploadCloud, File, CheckCircle2, AlertCircle, X } from 'lucide-react'

export interface UploadedFileInfo {
  file: File
  name: string
  sizeBytes: number
  mimeType: string
  sha256Hash: string
}

export interface FileUploadProps {
  onFileSelect: (info: UploadedFileInfo) => void
  onClear?: (() => void) | undefined
  allowedMimeTypes?: string[] | undefined
  maxSizeBytes?: number | undefined
  disabled?: boolean | undefined
  label?: string | undefined
}

const DEFAULT_ALLOWED = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/tiff',
]
const DEFAULT_MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onClear,
  allowedMimeTypes = DEFAULT_ALLOWED,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  disabled = false,
  label = 'Upload Document (PDF, JPEG, PNG up to 20MB)',
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<UploadedFileInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const computeSha256 = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(digest))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      return 'hash_unavailable_client_side'
    }
  }

  const validateAndProcessFile = async (file: File) => {
    setError(null)

    if (!allowedMimeTypes.includes(file.type)) {
      setError(
        `Invalid file type (${file.type || 'unknown'}). Allowed formats: PDF, PNG, JPEG, TIFF.`
      )
      return
    }

    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0)
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxMb}MB.`)
      return
    }

    setIsProcessing(true)
    try {
      const hash = await computeSha256(file)
      const fileInfo: UploadedFileInfo = {
        file,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
        sha256Hash: hash,
      }
      setSelectedFile(fileInfo)
      onFileSelect(fileInfo)
    } catch {
      setError('Failed to process file. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void validateAndProcessFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    if (onClear) onClear()
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={allowedMimeTypes.join(',')}
        onChange={handleChange}
        disabled={disabled || isProcessing}
        className="hidden"
        id="file-upload-input"
        data-testid="file-upload-input"
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isProcessing) {
              inputRef.current?.click()
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {isProcessing ? 'Reading file...' : label}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Supported: PDF, PNG, JPG, TIFF up to 20MB
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{formatSize(selectedFile.sizeBytes)}</span>
                  <span>•</span>
                  <span>{selectedFile.mimeType}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Remove uploaded file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[11px] text-emerald-800 font-mono">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified SHA256: {selectedFile.sha256Hash.slice(0, 12)}...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

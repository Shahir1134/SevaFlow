import React from 'react'

interface TextInputProps {
  id: string
  label?: string | undefined
  value?: string | undefined
  onChange: (value: string) => void
  placeholder?: string | undefined
  type?: ('text' | 'number') | undefined
  min?: number | undefined
  max?: number | undefined
  disabled?: boolean | undefined
  error?: string | undefined
  ariaDescribedBy?: string | undefined
  autoFocus?: boolean | undefined
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value = '',
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
  disabled = false,
  error,
  ariaDescribedBy,
  autoFocus = true,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={ariaDescribedBy}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
          error
            ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
            : 'border-slate-300 focus:border-indigo-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

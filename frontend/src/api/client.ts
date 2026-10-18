import type { ApiError } from '../types/api'

const API_BASE_URL =
  import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:8000/api'

export class ServiceUnavailableError extends Error implements ApiError {
  status = 503
  code = 'SERVICE_UNAVAILABLE'
  isServiceUnavailable = true
  details?: Record<string, unknown> | undefined

  constructor(message = 'The backend service is currently unreachable or offline.') {
    super(message)
    this.name = 'ServiceUnavailableError'
  }
}

export class AppApiError extends Error implements ApiError {
  status: number
  code: string
  isServiceUnavailable?: boolean | undefined
  details?: Record<string, unknown> | undefined

  constructor(status: number, code: string, message: string, details?: Record<string, unknown> | undefined) {
    super(message)
    this.name = 'AppApiError'
    this.status = status
    this.code = code
    this.details = details
    this.isServiceUnavailable = status === 503 || status === 502 || status === 504
  }
}

function getAuthHeader(): Record<string, string> {
  try {
    const token = localStorage.getItem('healthconnect_access_token')
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // ignore
  }
  return {}
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  }

  // Remove Content-Type if body is FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        throw new ServiceUnavailableError(
          `Service unavailable (status ${response.status}) at ${endpoint}`
        )
      }

      let errorData: { message?: string; detail?: string; code?: string } = {}
      try {
        errorData = await response.json()
      } catch {
        // non-json response
      }

      throw new AppApiError(
        response.status,
        errorData.code ?? 'API_ERROR',
        errorData.detail ?? errorData.message ?? `Request failed with status ${response.status}`
      )
    }

    return (await response.json()) as T
  } catch (error: unknown) {
    if (error instanceof AppApiError || error instanceof ServiceUnavailableError) {
      throw error
    }

    // Network error / connection refused
    throw new ServiceUnavailableError(
      `Cannot connect to HealthConnect India backend server at ${API_BASE_URL}. Ensure the backend service is running.`
    )
  }
}

// Build RequestInit without passing undefined headers (exactOptionalPropertyTypes)
function makeInit(method: string, extraHeaders?: Record<string, string>): RequestInit {
  const base: RequestInit = { method, headers: { ...getAuthHeader(), ...extraHeaders } }
  return base
}

function makeBodyInit(
  method: string,
  body: BodyInit,
  extraHeaders?: Record<string, string>
): RequestInit {
  return { method, body, headers: { ...getAuthHeader(), ...extraHeaders } }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, makeInit('GET', headers)),

  post: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, makeBodyInit(
      'POST',
      data instanceof FormData ? data : JSON.stringify(data ?? null),
      headers
    )),

  put: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, makeBodyInit('PUT', JSON.stringify(data ?? null), headers)),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    apiClient<T>(endpoint, makeInit('DELETE', headers)),
}


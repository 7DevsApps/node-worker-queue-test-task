import axios, { isAxiosError } from 'axios'
import { stringify } from 'qs'

export type HttpErrorPayload = {
  status: number
  body?: unknown
}

export type HttpError = Error & HttpErrorPayload

function createHttpError(
  message: string,
  status: number,
  body?: unknown,
): HttpError {
  const err = new Error(message) as HttpError
  err.status = status
  err.body = body
  return err
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    typeof (error as Partial<HttpErrorPayload>).status === 'number'
  )
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  responseType: 'json',
  paramsSerializer: (params) => {
    return stringify(params, { arrayFormat: 'comma' })
  },
})

axiosClient.interceptors.request.use((config) => {
  config.headers.set('Accept', 'application/json')
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0
      const body = error.response?.data as unknown
      const apiMessage = extractApiErrorMessage(body)
      const message =
        apiMessage ??
        (error.response?.statusText || error.message || 'Request failed')
      return Promise.reject(createHttpError(message, status, body))
    }
    return Promise.reject(error)
  },
)

function extractApiErrorMessage(body: unknown): string | undefined {
  if (
    body &&
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'string'
  ) {
    return (body as { error: string }).error
  }
  return undefined
}

const apiUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '')

export const env = {
  apiUrl,
}

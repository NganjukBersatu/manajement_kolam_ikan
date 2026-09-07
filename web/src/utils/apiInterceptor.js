// File ini "menyisipkan" header Authorization ke SETIAP fetch('/api/...')
// yang sudah ada di semua file Vue kamu, tanpa perlu mengubah satu-satu.
// Cukup import file ini SEKALI di main.js sebelum aplikasi di-mount.
import { getToken, clearToken } from './auth.js'

const originalFetch = window.fetch

window.fetch = async function (input, init = {}) {
  const url = typeof input === 'string' ? input : input.url

  const isApiCall = url.startsWith('/api')
  const isLoginCall = url.startsWith('/api/auth/login')

  if (isApiCall && !isLoginCall) {
    const token = getToken()
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`
      }
    }
  }

  const response = await originalFetch(input, init)

  // Kalau token sudah kedaluwarsa / tidak valid, otomatis lempar ke halaman login
  if (response.status === 401 && isApiCall && !isLoginCall) {
    clearToken()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  return response
}
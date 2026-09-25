// File ini "menyisipkan" header Authorization ke SETIAP fetch('/api/...')
// yang sudah ada di semua file Vue kamu, tanpa perlu mengubah satu-satu.
// Cukup import file ini SEKALI di main.js sebelum aplikasi di-mount.
//
// Selain itu, file ini juga otomatis mengganti alamat '/api/...' menjadi
// alamat penuh ke backend (VITE_API_URL) saat aplikasi di-deploy production,
// supaya semua fetch('/api/...') yang sudah ada di kode tidak perlu diubah satu-satu.
import { getToken, clearToken } from './auth.js'

const originalFetch = window.fetch

// Di dev, biarkan kosong supaya tetap lewat proxy Vite ('/api').
// Di production, isi VITE_API_URL di Railway dengan URL publik backend, contoh:
// VITE_API_URL = https://manajementkolamikan-production.up.railway.app/api
const API_BASE = import.meta.env.VITE_API_URL || ''

window.fetch = async function (input, init = {}) {
  let url = typeof input === 'string' ? input : input.url
  const isApiCall = url.startsWith('/api')
  const isLoginCall = url.startsWith('/api/auth/login')

  // Ganti '/api/...' jadi alamat penuh ke backend kalau API_BASE sudah diset
  if (isApiCall && API_BASE) {
    const path = url.replace(/^\/api/, '') // buang prefix '/api' dari url asal
    url = `${API_BASE}${path}`
    if (typeof input === 'string') {
      input = url
    } else {
      input = new Request(url, input)
    }
  }

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
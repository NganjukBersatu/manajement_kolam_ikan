<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../utils/auth.js'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function submit() {
  errorMsg.value = ''
  loading.value = true

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()

    if (!res.ok) {
      errorMsg.value = data.message || 'Username atau password salah'
      return
    }

    setToken(data.token)
    router.push('/')
  } catch (err) {
    errorMsg.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cream px-4">
    <div class="w-full max-w-[400px]">
      <!-- Card -->
      <div class="bg-white rounded-card shadow-card border border-ink-100 p-8">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
          <div class="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-2xl mb-3">
            K
          </div>
          <h1 class="text-ink-900 text-xl font-semibold tracking-tight">Manajement Kolam</h1>
          <p class="text-ink-500 text-[13px] mt-1">Masuk ke Dashboard</p>
        </div>

        <!-- Form -->
        <form class="space-y-5" @submit.prevent="submit">
          <!-- Username -->
          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Username</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                v-model="username"
                type="text"
                required
                autofocus
                placeholder="Masukkan username"
                class="w-full rounded-card border border-ink-100 bg-cream pl-10 pr-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Masukkan password"
                class="w-full rounded-card border border-ink-100 bg-cream pl-10 pr-11 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
              <!-- Icon Mata -->
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition"
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <!-- Mata terbuka (password tersembunyi) -->
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <!-- Mata tertutup (password terlihat) -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.27 20.27 0 0 1-3.22 4.47M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="errorMsg"
            class="flex items-center gap-2 bg-danger-100 border border-danger-500/30 text-danger-600 text-[13px] rounded-card px-4 py-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-card bg-brand-500 text-white py-3 text-[14px] font-semibold hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <svg
              v-if="loading"
              class="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {{ loading ? 'Memproses...' : 'Masuk' }}
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-ink-500 text-[12px] mt-6">
        Sistem Manajemen Kolam Ikan
      </p>
    </div>
  </div>
</template>
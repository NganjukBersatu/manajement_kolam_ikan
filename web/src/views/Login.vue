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
      errorMsg.value = data.message || 'Gagal login'
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
  <div class="min-h-screen flex items-center justify-center bg-ink-900 px-4">
    <div class="w-full max-w-sm bg-ink-700 rounded-card shadow-card p-6 border border-ink-500">
      <div class="flex items-center gap-2 mb-6 justify-center">
        <div class="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center font-bold text-brand-900">K</div>
        <span class="font-semibold text-white text-[16px]">Kolam Ikan</span>
      </div>

      <h1 class="text-[16px] font-semibold text-white mb-4 text-center">Masuk ke Dashboard</h1>

      <form class="space-y-3" @submit.prevent="submit">
        <div>
          <label class="block text-[13px] font-medium text-ink-300 mb-1">Username</label>
          <input
            v-model="username"
            type="text"
            required
            autofocus
            class="w-full rounded-lg border border-ink-500 px-3 py-2.5 text-[13.5px] bg-ink-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label class="block text-[13px] font-medium text-ink-300 mb-1">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="w-full rounded-lg border border-ink-500 px-3 py-2.5 pr-10 text-[13.5px] bg-ink-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-white"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a20.27 20.27 0 0 1-3.22 4.47M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="text-red-400 text-[13px]">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>
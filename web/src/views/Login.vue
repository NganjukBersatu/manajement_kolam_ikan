<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../utils/auth.js'
import { useAppBranding } from '../composables/useAppBranding.js'
import { useBusinessSettings } from '../composables/useBusinessSettings.js'
import NavIcon from '../components/NavIcon.vue'

const router = useRouter()

// Nama dan logo diambil dari Pengaturan (tersimpan di browser ini)
const { branding } = useAppBranding()
const { settings: usaha } = useBusinessSettings()
const logoUsaha = computed(() => usaha.value?.logo || '')
const logoGagal = ref(false)
watch(logoUsaha, () => (logoGagal.value = false))
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const inputClass =
  'w-full rounded-card border border-ink-100 bg-white pl-11 py-3 text-[14.5px] text-ink-900 placeholder:text-ink-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition ' +
  'dark:bg-ink-700 dark:border-ink-500 dark:text-white'

const poin = [
  'Jadwal pakan, obat, sortir, dan panen',
  'Stok pakan dan pengeluaran',
  'Penjualan dan keuntungan tiap bulan'
]

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
  <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-cream dark:bg-ink-900">
    <!-- Panel kiri: identitas aplikasi (tersembunyi di layar kecil) -->
    <aside class="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-700 text-white p-12">
      <div class="flex items-center gap-3 relative z-10">
        <div class="w-11 h-11 rounded-xl bg-gold-500 flex items-center justify-center text-brand-900 overflow-hidden shrink-0">
          <img v-if="logoUsaha && !logoGagal" :src="logoUsaha" alt="Logo" class="w-full h-full object-cover" @error="logoGagal = true" />
          <NavIcon v-else name="kolam" :size="22" />
        </div>
        <span class="font-semibold text-[16px] truncate max-w-[18rem]">{{ branding.namaAplikasi }}</span>
      </div>

      <!-- Riak air: elemen utama halaman -->
      <svg
        class="absolute -right-32 -bottom-32 w-[640px] h-[640px] pointer-events-none"
        viewBox="0 0 600 600"
        fill="none"
        aria-hidden="true"
      >
        <circle class="riak" style="animation-delay: 0s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle class="riak" style="animation-delay: 1.5s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle class="riak" style="animation-delay: 3s" cx="300" cy="300" r="280" stroke="#D9A448" stroke-width="1.5" />
        <circle cx="300" cy="300" r="210" stroke="#2C7A74" stroke-opacity="0.5" stroke-width="1.5" />
        <circle cx="300" cy="300" r="140" stroke="#2C7A74" stroke-opacity="0.6" stroke-width="1.5" />
        <circle cx="300" cy="300" r="70" stroke="#2C7A74" stroke-opacity="0.8" stroke-width="1.5" />
        <circle cx="300" cy="300" r="10" fill="#D9A448" />
      </svg>

      <div class="relative z-10 max-w-md">
        <h2 class="text-[34px] leading-[1.15] font-bold tracking-tight">
          Semua kolam, satu layar.
        </h2>
        <p class="mt-4 text-brand-100 text-[15px] leading-relaxed">
          Pantau budidaya ikan, udang, dan kepiting tanpa buku catatan yang tercecer.
        </p>
        <ul class="mt-8 space-y-3 text-[14px] text-white/90">
          <li v-for="t in poin" :key="t" class="flex items-start gap-3">
            <svg class="mt-0.5 shrink-0 text-gold-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ t }}
          </li>
        </ul>
      </div>
    </aside>

    <!-- Panel kanan: formulir -->
    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[380px]">
        <!-- Logo untuk layar kecil -->
        <div class="lg:hidden flex items-center gap-3 mb-10">
          <div class="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white overflow-hidden shrink-0">
            <img v-if="logoUsaha && !logoGagal" :src="logoUsaha" alt="Logo" class="w-full h-full object-cover" @error="logoGagal = true" />
            <NavIcon v-else name="kolam" :size="22" />
          </div>
          <span class="font-semibold text-ink-900 dark:text-white truncate">{{ branding.namaAplikasi }}</span>
        </div>

        <h1 class="text-ink-900 dark:text-white text-[28px] font-bold tracking-tight">Masuk</h1>
        <p class="text-ink-500 dark:text-ink-300 text-[14px] mt-1.5">
          Lanjutkan memantau kolam Anda.
        </p>

        <form class="space-y-5 mt-8" @submit.prevent="submit">
          <!-- Username -->
          <div>
            <label for="username" class="block text-[13px] font-medium text-ink-700 dark:text-ink-100 mb-1.5">Username</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autofocus
                autocomplete="username"
                placeholder="Masukkan username"
                :class="[inputClass, 'pr-4']"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-[13px] font-medium text-ink-700 dark:text-ink-100 mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="Masukkan password"
                :class="[inputClass, 'pr-12']"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-ink-300 hover:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 transition"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="showPassword = !showPassword"
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

          <!-- Pesan galat -->
          <div
            v-if="errorMsg"
            role="alert"
            class="flex items-start gap-2 bg-danger-100 border border-danger-500/30 text-danger-600 text-[13px] rounded-card px-4 py-3"
          >
            <svg class="mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Tombol -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-card bg-brand-500 text-white py-3.5 text-[14.5px] font-semibold hover:bg-brand-600 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20"
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

        <p class="text-ink-500 dark:text-ink-300 text-[13px] mt-8">
          Belum punya akun?
          <router-link to="/register" class="text-brand-500 dark:text-brand-400 font-semibold hover:underline">Daftar di sini</router-link>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.riak {
  transform-box: fill-box;
  transform-origin: center;
  animation: riak 6s ease-out infinite;
  opacity: 0;
}

@keyframes riak {
  0% { transform: scale(0.15); opacity: 0.55; }
  100% { transform: scale(1); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .riak { animation: none; opacity: 0; }
}
</style>
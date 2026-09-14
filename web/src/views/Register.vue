<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../utils/auth.js'
import { useBusinessSettings } from '../composables/useBusinessSettings.js'

const router = useRouter()
const { setFromRegistration } = useBusinessSettings()

const step = ref(1)
const totalSteps = 4
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  address: '',
  phone: '',
  otherCommodity: ''
})

const commodityOptions = [
  { key: 'ikan', label: 'Ikan' },
  { key: 'udang', label: 'Udang' },
  { key: 'kepiting', label: 'Kepiting' },
  { key: 'lainnya', label: 'Lainnya' }
]

const selectedCommodities = ref([])
const poolCounts = reactive({ ikan: 1, udang: 1, kepiting: 1, lainnya: 1 })

function toggleCommodity(key) {
  const idx = selectedCommodities.value.indexOf(key)
  if (idx === -1) {
    selectedCommodities.value.push(key)
  } else {
    selectedCommodities.value.splice(idx, 1)
  }
}

const totalPools = computed(() =>
  selectedCommodities.value.reduce((sum, key) => sum + (Number(poolCounts[key]) || 0), 0)
)

const selectedLabels = computed(() =>
  commodityOptions
    .filter(c => selectedCommodities.value.includes(c.key))
    .map(c => (c.key === 'lainnya' && form.otherCommodity ? form.otherCommodity : c.label))
)

function validateStep(current) {
  errorMsg.value = ''

  if (current === 1) {
    if (!form.username.trim()) {
      errorMsg.value = 'Username wajib diisi'
      return false
    }
    if (form.password.length < 8) {
      errorMsg.value = 'Password minimal 8 karakter'
      return false
    }
    if (form.password !== form.confirmPassword) {
      errorMsg.value = 'Konfirmasi password tidak sama'
      return false
    }
  }

  if (current === 2) {
    if (!form.businessName.trim()) {
      errorMsg.value = 'Nama usaha wajib diisi'
      return false
    }
    if (!form.address.trim()) {
      errorMsg.value = 'Alamat lokasi usaha wajib diisi'
      return false
    }
  }

  if (current === 3) {
    if (selectedCommodities.value.length === 0) {
      errorMsg.value = 'Pilih minimal satu komoditas'
      return false
    }
    if (selectedCommodities.value.includes('lainnya') && !form.otherCommodity.trim()) {
      errorMsg.value = 'Sebutkan nama komoditas lainnya'
      return false
    }
  }

  return true
}

function nextStep() {
  if (!validateStep(step.value)) return
  step.value += 1
}

function prevStep() {
  errorMsg.value = ''
  step.value -= 1
}

async function submit() {
  if (!validateStep(3)) {
    step.value = 3
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    const commoditiesPayload = selectedCommodities.value.map(key => ({
      key,
      label: key === 'lainnya' ? form.otherCommodity : commodityOptions.find(c => c.key === key).label,
      initialPools: Number(poolCounts[key]) || 0
    }))

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        business: {
          name: form.businessName,
          address: form.address,
          phone: form.phone
        },
        commodities: commoditiesPayload
      })
    })
    const data = await res.json()

    if (!res.ok) {
      errorMsg.value = data.message || 'Pendaftaran gagal, coba lagi'
      return
    }

    // Simpan token
    setToken(data.token)

    // Sinkronkan data ke useBusinessSettings supaya langsung muncul di dashboard & pengaturan
    setFromRegistration({
      name: form.businessName,
      address: form.address,
      phone: form.phone,
      commodities: commoditiesPayload
    })

    router.push('/')
  } catch (err) {
    errorMsg.value = 'Tidak bisa terhubung ke server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
    <div class="w-full max-w-[460px]">
      <!-- Card -->
      <div class="bg-white rounded-card shadow-card border border-ink-100 p-8">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-6">
          <div class="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-2xl mb-3">
            K
          </div>
          <h1 class="text-ink-900 text-xl font-semibold tracking-tight">Manajement Kolam</h1>
          <p class="text-ink-500 text-[13px] mt-1">Daftarkan usaha budidayamu</p>
        </div>

        <!-- Step indicator -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <template v-for="n in totalSteps" :key="n">
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border transition"
              :class="n < step
                ? 'bg-brand-500 border-brand-500 text-white'
                : n === step
                  ? 'border-brand-500 text-brand-500'
                  : 'border-ink-100 text-ink-300'"
            >
              {{ n < step ? '✓' : n }}
            </div>
            <div v-if="n < totalSteps" class="w-6 h-px" :class="n < step ? 'bg-brand-500' : 'bg-ink-100'"></div>
          </template>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMsg"
          class="flex items-center gap-2 bg-danger-100 border border-danger-500/30 text-danger-600 text-[13px] rounded-card px-4 py-3 mb-5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ errorMsg }}
        </div>

        <!-- STEP 1: Akun -->
        <form v-if="step === 1" class="space-y-5" @submit.prevent="nextStep">
          <div>
            <h2 class="text-ink-900 text-[15px] font-semibold mb-0.5">Buat akun</h2>
            <p class="text-ink-500 text-[12.5px] mb-4">Ini akun pemilik usaha untuk masuk ke dashboard.</p>
          </div>

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
                v-model="form.username"
                type="text"
                required
                autofocus
                placeholder="Masukkan username"
                class="w-full rounded-card border border-ink-100 bg-cream pl-10 pr-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>
          </div>

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
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Minimal 8 karakter"
                class="w-full rounded-card border border-ink-100 bg-cream pl-10 pr-11 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition"
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

          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Ulangi password</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="Ketik ulang password"
                class="w-full rounded-card border border-ink-100 bg-cream pl-10 pr-11 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition"
                @click="showConfirmPassword = !showConfirmPassword"
                tabindex="-1"
              >
                <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <button
            type="submit"
            class="w-full rounded-card bg-brand-500 text-white py-3 text-[14px] font-semibold hover:bg-brand-600 transition-all"
          >
            Lanjut
          </button>
        </form>

        <!-- STEP 2: Profil usaha -->
        <form v-if="step === 2" class="space-y-5" @submit.prevent="nextStep">
          <div>
            <h2 class="text-ink-900 text-[15px] font-semibold mb-0.5">Profil usaha</h2>
            <p class="text-ink-500 text-[12.5px] mb-4">Bisa diubah lagi nanti lewat halaman Pengaturan.</p>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Nama usaha</label>
            <input
              v-model="form.businessName"
              type="text"
              required
              autofocus
              placeholder="cth. Kolam Kalcer"
              class="w-full rounded-card border border-ink-100 bg-cream px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
            />
          </div>

          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Alamat lokasi usaha</label>
            <textarea
              v-model="form.address"
              rows="3"
              required
              placeholder="Dusun, desa, kecamatan, kabupaten"
              class="w-full rounded-card border border-ink-100 bg-cream px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-[13px] font-medium text-ink-700 mb-1.5">Nomor telepon usaha</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="08xxxxxxxxxx"
              class="w-full rounded-card border border-ink-100 bg-cream px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
            />
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="prevStep"
              class="flex-1 rounded-card border border-ink-100 text-ink-700 py-3 text-[14px] font-semibold hover:bg-cream transition-all"
            >
              Kembali
            </button>
            <button
              type="submit"
              class="flex-1 rounded-card bg-brand-500 text-white py-3 text-[14px] font-semibold hover:bg-brand-600 transition-all"
            >
              Lanjut
            </button>
          </div>
        </form>

        <!-- STEP 3: Komoditas -->
        <form v-if="step === 3" class="space-y-5" @submit.prevent="nextStep">
          <div>
            <h2 class="text-ink-900 text-[15px] font-semibold mb-0.5">Apa yang kamu budidayakan?</h2>
            <p class="text-ink-500 text-[12.5px] mb-4">Pilih satu atau lebih. Menu dashboard menyesuaikan pilihanmu.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="c in commodityOptions"
              :key="c.key"
              @click="toggleCommodity(c.key)"
              class="relative rounded-card border p-4 cursor-pointer transition"
              :class="selectedCommodities.includes(c.key)
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-ink-100 hover:border-ink-300'"
            >
              <div
                class="absolute top-3 right-3 w-[18px] h-[18px] rounded-full border flex items-center justify-center"
                :class="selectedCommodities.includes(c.key) ? 'bg-brand-500 border-brand-500' : 'border-ink-100'"
              >
                <svg v-if="selectedCommodities.includes(c.key)" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div class="mb-2" :class="selectedCommodities.includes(c.key) ? 'text-brand-500' : 'text-ink-300'">
                <svg v-if="c.key === 'ikan'" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 24c6-9 16-14 24-14 8 0 12 6 12 14s-4 14-12 14c-8 0-18-5-24-14Z"/>
                  <path d="M42 24l6-6v12l-6-6Z"/>
                  <circle cx="16" cy="21" r="1.6" fill="currentColor" stroke="none"/>
                </svg>
                <svg v-else-if="c.key === 'udang'" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 30c0-9 6-17 15-19 1.5-3 4.5-4.5 8-4l-2 4c3 1 5 3 6 6l4-1-1 4c2 2 3 5 2 8-2 7-9 11-17 11-8 0-16-3-15-9Z"/>
                  <path d="M14 30c-2 2-4 3-7 3"/>
                </svg>
                <svg v-else-if="c.key === 'kepiting'" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="24" cy="26" rx="13" ry="9"/>
                  <path d="M11 22 4 16M11 30 4 35M37 22l7-6M37 30l7 5"/>
                  <path d="M17 18l-3-6M31 18l3-6"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="24" cy="24" r="16"/>
                  <path d="M24 17v14M17 24h14"/>
                </svg>
              </div>

              <div class="text-ink-900 text-[14px] font-semibold">{{ c.label }}</div>

              <div v-if="selectedCommodities.includes(c.key) && c.key !== 'lainnya'" class="flex items-center gap-2 mt-3 pt-3 border-t border-ink-100" @click.stop>
                <span class="text-[12px] text-ink-500">Kolam awal</span>
                <input
                  v-model.number="poolCounts[c.key]"
                  type="number"
                  min="0"
                  class="w-14 rounded-md border border-ink-100 px-2 py-1 text-[12.5px] text-center focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>

              <div v-if="selectedCommodities.includes(c.key) && c.key === 'lainnya'" class="mt-3 pt-3 border-t border-ink-100" @click.stop>
                <input
                  v-model="form.otherCommodity"
                  type="text"
                  placeholder="cth. Lele, Gurame"
                  class="w-full rounded-md border border-ink-100 px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="prevStep"
              class="flex-1 rounded-card border border-ink-100 text-ink-700 py-3 text-[14px] font-semibold hover:bg-cream transition-all"
            >
              Kembali
            </button>
            <button
              type="submit"
              class="flex-1 rounded-card bg-brand-500 text-white py-3 text-[14px] font-semibold hover:bg-brand-600 transition-all"
            >
              Lanjut
            </button>
          </div>
        </form>

        <!-- STEP 4: Ringkasan -->
        <div v-if="step === 4" class="space-y-5">
          <div>
            <h2 class="text-ink-900 text-[15px] font-semibold mb-0.5">Semua siap</h2>
            <p class="text-ink-500 text-[12.5px] mb-4">Periksa lagi sebelum membuat akun.</p>
          </div>

          <div class="rounded-card border border-ink-100 divide-y divide-ink-100">
            <div class="flex justify-between px-4 py-3 text-[13.5px]">
              <span class="text-ink-500">Username</span>
              <span class="text-ink-900 font-medium">{{ form.username }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-[13.5px]">
              <span class="text-ink-500">Nama usaha</span>
              <span class="text-ink-900 font-medium">{{ form.businessName }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-[13.5px] gap-4">
              <span class="text-ink-500 shrink-0">Komoditas</span>
              <span class="text-ink-900 font-medium text-right">{{ selectedLabels.join(', ') }}</span>
            </div>
            <div class="flex justify-between px-4 py-3 text-[13.5px]">
              <span class="text-ink-500">Total kolam awal</span>
              <span class="text-ink-900 font-medium">{{ totalPools }} kolam</span>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              @click="prevStep"
              :disabled="loading"
              class="flex-1 rounded-card border border-ink-100 text-ink-700 py-3 text-[14px] font-semibold hover:bg-cream disabled:opacity-60 transition-all"
            >
              Kembali
            </button>
            <button
              type="button"
              @click="submit"
              :disabled="loading"
              class="flex-1 rounded-card bg-brand-500 text-white py-3 text-[14px] font-semibold hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
              {{ loading ? 'Memproses...' : 'Buat akun' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-ink-500 text-[12px] mt-6">
        Sudah punya akun?
        <router-link to="/login" class="text-brand-500 font-semibold hover:underline">Masuk di sini</router-link>
      </p>
    </div>
  </div>
</template>
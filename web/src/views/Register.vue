<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { setToken } from '../utils/auth.js'
import { useAppBranding } from '../composables/useAppBranding.js'
import { useBusinessSettings } from '../composables/useBusinessSettings.js'
import NavIcon from '../components/NavIcon.vue'

const router = useRouter()

// Nama dan logo diambil dari Pengaturan (tersimpan di browser ini)
const { branding } = useAppBranding()
const { settings: usaha, setFromRegistration } = useBusinessSettings()
const logoUsaha = computed(() => usaha.value?.logo || '')
const logoGagal = ref(false)
watch(logoUsaha, () => (logoGagal.value = false))

const step = ref(1)
const totalSteps = 4
const errorMsg = ref('')
const loading = ref(false)
const show = reactive({ password: false, confirmPassword: false })

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  address: '',
  phone: '',
  otherCommodity: ''
})

// Gaya bersama (sama dengan halaman login)
const base =
  'w-full rounded-card border border-ink-100 bg-white py-3 text-[14.5px] text-ink-900 placeholder:text-ink-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition ' +
  'dark:bg-ink-700 dark:border-ink-500 dark:text-white'
const inputIcon = base + ' pl-11 pr-12'
const inputPlain = base + ' px-4'
const labelClass = 'block text-[13px] font-medium text-ink-700 dark:text-ink-100 mb-1.5'
const btnPrimary =
  'flex-1 rounded-card bg-brand-500 text-white py-3.5 text-[14.5px] font-semibold hover:bg-brand-600 active:scale-[0.99] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm shadow-brand-500/20'
const btnGhost =
  'flex-1 rounded-card border border-ink-100 dark:border-ink-500 text-ink-700 dark:text-ink-100 py-3.5 text-[14.5px] font-semibold ' +
  'hover:bg-white dark:hover:bg-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 disabled:opacity-60 transition-all'

const langkah = [
  { judul: 'Buat akun', ket: 'Username dan password' },
  { judul: 'Profil usaha', ket: 'Nama, alamat, dan telepon' },
  { judul: 'Komoditas', ket: 'Ikan, udang, kepiting, dll.' },
  { judul: 'Ringkasan', ket: 'Periksa lalu buat akun' }
]

const passFields = [
  { key: 'password', label: 'Password', placeholder: 'Minimal 8 karakter', autocomplete: 'new-password' },
  { key: 'confirmPassword', label: 'Ulangi password', placeholder: 'Ketik ulang password', autocomplete: 'new-password' }
]

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

const ringkasan = computed(() => [
  ['Username', form.username],
  ['Nama usaha', form.businessName],
  ['Komoditas', selectedLabels.value.join(', ')],
  ['Total kolam awal', `${totalPools.value} kolam`]
])

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
  <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-cream dark:bg-ink-900">
    <!-- Panel kiri: identitas + daftar langkah (tersembunyi di layar kecil) -->
    <aside class="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-700 text-white p-12">
      <div class="flex items-center gap-3 relative z-10">
        <div class="w-11 h-11 rounded-xl bg-gold-500 flex items-center justify-center text-brand-900 overflow-hidden shrink-0">
          <img v-if="logoUsaha && !logoGagal" :src="logoUsaha" alt="Logo" class="w-full h-full object-cover" @error="logoGagal = true" />
          <NavIcon v-else name="kolam" :size="22" />
        </div>
        <span class="font-semibold text-[16px] truncate max-w-[18rem]">{{ branding.namaAplikasi }}</span>
      </div>

      <!-- Riak air -->
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
          Daftarkan usaha budidaya dalam empat langkah.
        </h2>

        <ol class="mt-10">
          <li
            v-for="(l, i) in langkah"
            :key="l.judul"
            class="relative flex items-start gap-4"
            :class="i < langkah.length - 1 ? 'pb-7' : ''"
          >
            <div
              v-if="i < langkah.length - 1"
              class="absolute left-[15px] top-9 bottom-1 w-px"
              :class="i + 1 < step ? 'bg-gold-500' : 'bg-white/20'"
            ></div>
            <div
              class="relative w-[31px] h-[31px] shrink-0 rounded-full flex items-center justify-center text-[13px] font-semibold border transition"
              :class="i + 1 < step
                ? 'bg-gold-500 border-gold-500 text-brand-900'
                : i + 1 === step
                  ? 'border-gold-400 text-gold-400'
                  : 'border-white/25 text-white/50'"
            >
              <svg v-if="i + 1 < step" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <template v-else>{{ i + 1 }}</template>
            </div>
            <div class="pt-0.5" :aria-current="i + 1 === step ? 'step' : undefined">
              <div class="text-[15px] font-semibold" :class="i + 1 <= step ? 'text-white' : 'text-white/60'">{{ l.judul }}</div>
              <div class="text-[13px]" :class="i + 1 <= step ? 'text-brand-100' : 'text-white/40'">{{ l.ket }}</div>
            </div>
          </li>
        </ol>
      </div>
    </aside>

    <!-- Panel kanan: formulir -->
    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[420px]">
        <!-- Logo dan progres untuk layar kecil -->
        <div class="lg:hidden mb-8">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white overflow-hidden shrink-0">
              <img v-if="logoUsaha && !logoGagal" :src="logoUsaha" alt="Logo" class="w-full h-full object-cover" @error="logoGagal = true" />
              <NavIcon v-else name="kolam" :size="22" />
            </div>
            <span class="font-semibold text-ink-900 dark:text-white truncate">{{ branding.namaAplikasi }}</span>
          </div>
          <div class="flex gap-1.5" aria-hidden="true">
            <div
              v-for="n in totalSteps"
              :key="n"
              class="h-1.5 flex-1 rounded-full transition"
              :class="n <= step ? 'bg-brand-500' : 'bg-ink-100 dark:bg-ink-500'"
            ></div>
          </div>
        </div>

        <p class="text-ink-500 dark:text-ink-300 text-[13px] mb-1">Langkah {{ step }} dari {{ totalSteps }}</p>
        <h1 class="text-ink-900 dark:text-white text-[28px] font-bold tracking-tight">{{ langkah[step - 1].judul }}</h1>
        <p class="text-ink-500 dark:text-ink-300 text-[14px] mt-1.5">
          <template v-if="step === 1">Ini akun pemilik usaha untuk masuk ke dashboard.</template>
          <template v-else-if="step === 2">Bisa diubah lagi nanti lewat halaman Pengaturan.</template>
          <template v-else-if="step === 3">Pilih satu atau lebih. Menu dashboard menyesuaikan pilihanmu.</template>
          <template v-else>Periksa lagi sebelum membuat akun.</template>
        </p>

        <!-- Pesan galat -->
        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-2 bg-danger-100 border border-danger-500/30 text-danger-600 text-[13px] rounded-card px-4 py-3 mt-6"
        >
          <svg class="mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {{ errorMsg }}
        </div>

        <!-- LANGKAH 1: Akun -->
        <form v-if="step === 1" class="space-y-5 mt-7" @submit.prevent="nextStep">
          <div>
            <label for="username" :class="labelClass">Username</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input id="username" v-model="form.username" type="text" required autofocus autocomplete="username" placeholder="Masukkan username" :class="inputIcon" />
            </div>
          </div>

          <div v-for="f in passFields" :key="f.key">
            <label :for="f.key" :class="labelClass">{{ f.label }}</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                :id="f.key"
                v-model="form[f.key]"
                :type="show[f.key] ? 'text' : 'password'"
                required
                :autocomplete="f.autocomplete"
                :placeholder="f.placeholder"
                :class="inputIcon"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-ink-300 hover:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 transition"
                :aria-label="show[f.key] ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="show[f.key] = !show[f.key]"
              >
                <svg v-if="!show[f.key]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

          <div class="flex gap-3 pt-1">
            <button type="submit" :class="btnPrimary">Lanjut</button>
          </div>
        </form>

        <!-- LANGKAH 2: Profil usaha -->
        <form v-if="step === 2" class="space-y-5 mt-7" @submit.prevent="nextStep">
          <div>
            <label for="businessName" :class="labelClass">Nama usaha</label>
            <input id="businessName" v-model="form.businessName" type="text" required autofocus placeholder="cth. Kolam Kalcer" :class="inputPlain" />
          </div>

          <div>
            <label for="address" :class="labelClass">Alamat lokasi usaha</label>
            <textarea id="address" v-model="form.address" rows="3" required placeholder="Dusun, desa, kecamatan, kabupaten" :class="[inputPlain, 'resize-none']"></textarea>
          </div>

          <div>
            <label for="phone" :class="labelClass">Nomor telepon usaha</label>
            <input id="phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" :class="inputPlain" />
          </div>

          <div class="flex gap-3 pt-1">
            <button type="button" :class="btnGhost" @click="prevStep">Kembali</button>
            <button type="submit" :class="btnPrimary">Lanjut</button>
          </div>
        </form>

        <!-- LANGKAH 3: Komoditas -->
        <form v-if="step === 3" class="space-y-5 mt-7" @submit.prevent="nextStep">
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="c in commodityOptions"
              :key="c.key"
              role="checkbox"
              tabindex="0"
              :aria-checked="selectedCommodities.includes(c.key)"
              @click="toggleCommodity(c.key)"
              @keydown.enter.prevent="toggleCommodity(c.key)"
              @keydown.space.prevent="toggleCommodity(c.key)"
              class="relative rounded-card border p-4 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
              :class="selectedCommodities.includes(c.key)
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : 'border-ink-100 bg-white dark:bg-ink-700 dark:border-ink-500 hover:border-ink-300'"
            >
              <div
                class="absolute top-3 right-3 w-[18px] h-[18px] rounded-full border flex items-center justify-center"
                :class="selectedCommodities.includes(c.key) ? 'bg-brand-500 border-brand-500' : 'border-ink-100 dark:border-ink-500'"
              >
                <svg v-if="selectedCommodities.includes(c.key)" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div class="mb-2" :class="selectedCommodities.includes(c.key) ? 'text-brand-500 dark:text-brand-400' : 'text-ink-300'">
                <svg v-if="c.key === 'ikan'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 24c6-9 16-14 24-14 8 0 12 6 12 14s-4 14-12 14c-8 0-18-5-24-14Z"/>
                  <path d="M42 24l6-6v12l-6-6Z"/>
                  <circle cx="16" cy="21" r="1.6" fill="currentColor" stroke="none"/>
                </svg>
                <svg v-else-if="c.key === 'udang'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 30c0-9 6-17 15-19 1.5-3 4.5-4.5 8-4l-2 4c3 1 5 3 6 6l4-1-1 4c2 2 3 5 2 8-2 7-9 11-17 11-8 0-16-3-15-9Z"/>
                  <path d="M14 30c-2 2-4 3-7 3"/>
                </svg>
                <svg v-else-if="c.key === 'kepiting'" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <ellipse cx="24" cy="26" rx="13" ry="9"/>
                  <path d="M11 22 4 16M11 30 4 35M37 22l7-6M37 30l7 5"/>
                  <path d="M17 18l-3-6M31 18l3-6"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="24" cy="24" r="16"/>
                  <path d="M24 17v14M17 24h14"/>
                </svg>
              </div>

              <div class="text-ink-900 dark:text-white text-[14px] font-semibold">{{ c.label }}</div>

              <div
                v-if="selectedCommodities.includes(c.key) && c.key !== 'lainnya'"
                class="flex items-center gap-2 mt-3 pt-3 border-t border-ink-100 dark:border-ink-500"
                @click.stop
                @keydown.stop
              >
                <label :for="'kolam-' + c.key" class="text-[12px] text-ink-500 dark:text-ink-300">Kolam awal</label>
                <input
                  :id="'kolam-' + c.key"
                  v-model.number="poolCounts[c.key]"
                  type="number"
                  min="0"
                  class="w-14 rounded-md border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-700 dark:text-white px-2 py-1 text-[12.5px] text-center focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>

              <div
                v-if="selectedCommodities.includes(c.key) && c.key === 'lainnya'"
                class="mt-3 pt-3 border-t border-ink-100 dark:border-ink-500"
                @click.stop
                @keydown.stop
              >
                <input
                  v-model="form.otherCommodity"
                  type="text"
                  aria-label="Nama komoditas lainnya"
                  placeholder="cth. Lele, Gurame"
                  class="w-full rounded-md border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-700 dark:text-white px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button type="button" :class="btnGhost" @click="prevStep">Kembali</button>
            <button type="submit" :class="btnPrimary">Lanjut</button>
          </div>
        </form>

        <!-- LANGKAH 4: Ringkasan -->
        <div v-if="step === 4" class="space-y-6 mt-7">
          <dl class="rounded-card border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-700 divide-y divide-ink-100 dark:divide-ink-500">
            <div v-for="r in ringkasan" :key="r[0]" class="flex justify-between gap-4 px-4 py-3.5 text-[13.5px]">
              <dt class="text-ink-500 dark:text-ink-300 shrink-0">{{ r[0] }}</dt>
              <dd class="text-ink-900 dark:text-white font-medium text-right">{{ r[1] }}</dd>
            </div>
          </dl>

          <div class="flex gap-3">
            <button type="button" :disabled="loading" :class="btnGhost" @click="prevStep">Kembali</button>
            <button type="button" :disabled="loading" :class="btnPrimary" @click="submit">
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

        <p class="text-ink-500 dark:text-ink-300 text-[13px] mt-8">
          Sudah punya akun?
          <router-link to="/login" class="text-brand-500 dark:text-brand-400 font-semibold hover:underline">Masuk di sini</router-link>
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
<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { useProfile } from '../composables/useProfile.js'
import {
  useBusinessSettings,
  KOMODITAS_PRESET,
  ZONA_WAKTU_OPTIONS,
  MATA_UANG_OPTIONS
} from '../composables/useBusinessSettings.js'
import { useAppBranding, NAMA_APLIKASI_BAWAAN } from '../composables/useAppBranding.js'
import NavIcon from '../components/NavIcon.vue'

const { isDark, toggle } = useTheme()
const { profile, initials, handleFileSelect, removePhoto, updateProfile } = useProfile()
const {
  settings: usaha,
  updateSettings: updateUsaha,
  toggleCommodity,
  isCommoditySelected,
  handleLogoSelect,
  removeLogo,
  loadFromApi,
  saveToApi
} = useBusinessSettings()
const { branding, MENU_ITEMS, saveBranding, resetBranding } = useAppBranding()

// ===== Tab =====
const tabs = [
  { key: 'usaha', label: 'Usaha' },
  { key: 'tampilan', label: 'Tampilan & menu' },
  { key: 'notifikasi', label: 'Notifikasi' },
  { key: 'akun', label: 'Akun' }
]
const tab = ref('usaha')

// ===== Gaya bersama =====
const cardCls = 'bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5'
const inputCls =
  'w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]'
const labelCls = 'block text-[13px] font-medium dark:text-ink-300 mb-1'
const primaryBtn =
  'rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60'
const ghostBtn =
  'rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 px-4 py-2.5 text-[13.5px] font-medium hover:bg-ink-100 dark:hover:bg-ink-600 transition'

// ===== Simpan pengaturan usaha (dipakai tab Usaha, Tampilan, Notifikasi) =====
const savingUsaha = ref(false)
const usahaMsg = ref('')
const usahaMsgError = ref(false)
let usahaTimer

async function simpanUsaha() {
  savingUsaha.value = true
  usahaMsg.value = ''
  usahaMsgError.value = false
  try {
    updateUsaha({ ...usaha.value })
    await saveToApi()
    usahaMsg.value = 'Perubahan disimpan.'
  } catch (err) {
    usahaMsgError.value = true
    usahaMsg.value = 'Gagal menyimpan. Coba lagi.'
  } finally {
    savingUsaha.value = false
    clearTimeout(usahaTimer)
    usahaTimer = setTimeout(() => (usahaMsg.value = ''), 3000)
  }
}

watch(tab, () => {
  usahaMsg.value = ''
  brandingMsg.value = ''
})

// ===== Logo usaha =====
const logoInput = ref(null)
const logoError = ref('')
const uploadingLogo = ref(false)

function triggerLogoInput() {
  logoInput.value?.click()
}

async function onLogoChange(e) {
  const file = e.target.files?.[0]
  logoError.value = ''
  if (!file) return

  uploadingLogo.value = true
  try {
    await handleLogoSelect(file)
  } catch (err) {
    logoError.value = err.message
  } finally {
    uploadingLogo.value = false
    e.target.value = ''
  }
}

// ===== Nama aplikasi, label menu, dan judul halaman =====
const draft = reactive({ namaAplikasi: '', labels: {}, subtitles: {} })
const brandingMsg = ref('')

function isiDraft() {
  draft.namaAplikasi = branding.namaAplikasi
  draft.labels = { ...branding.labels }
  draft.subtitles = { ...branding.subtitles }
}
isiDraft()

const grupMenu = computed(() => {
  const hasil = {}
  for (const item of MENU_ITEMS) {
    if (!hasil[item.group]) hasil[item.group] = []
    hasil[item.group].push(item)
  }
  return Object.entries(hasil)
})

function simpanBranding() {
  saveBranding(draft)
  isiDraft()
  brandingMsg.value = 'Nama dan judul halaman diperbarui.'
  setTimeout(() => (brandingMsg.value = ''), 3000)
}

function kembalikanBawaan() {
  if (!confirm('Kembalikan nama aplikasi, menu, dan judul halaman ke bawaan?')) return
  resetBranding()
  isiDraft()
  brandingMsg.value = 'Dikembalikan ke bawaan.'
  setTimeout(() => (brandingMsg.value = ''), 3000)
}

// ===== Profil =====
const akun = ref({ nama: '', email: '' })
const savingAkun = ref(false)
const akunMsg = ref('')
const fileInput = ref(null)
const uploadError = ref('')
const uploading = ref(false)

async function muatAkun() {
  try {
    const res = await fetch('/api/pengaturan/akun')
    const json = await res.json()
    akun.value = { nama: json.data.nama, email: json.data.email || '' }
    updateProfile({ name: json.data.nama, email: json.data.email || '' })
  } catch (err) {
    console.error('Gagal memuat akun:', err)
  }
}

async function simpanAkun() {
  savingAkun.value = true
  akunMsg.value = ''
  try {
    const res = await fetch('/api/pengaturan/akun', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(akun.value)
    })
    if (!res.ok) throw new Error('gagal')
    updateProfile({ name: akun.value.nama, email: akun.value.email })
    akunMsg.value = 'Profil berhasil disimpan.'
  } catch (err) {
    akunMsg.value = 'Gagal menyimpan profil.'
  } finally {
    savingAkun.value = false
    setTimeout(() => (akunMsg.value = ''), 3000)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  uploadError.value = ''
  if (!file) return

  uploading.value = true
  try {
    await handleFileSelect(file)
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

// ===== Ubah sandi =====
const sandi = ref({ lama: '', baru: '', konfirmasi: '' })
const showSandi = ref({ lama: false, baru: false, konfirmasi: false })
const savingSandi = ref(false)
const sandiError = ref('')
const sandiSukses = ref('')

const kolomSandi = [
  { key: 'lama', label: 'Sandi saat ini' },
  { key: 'baru', label: 'Sandi baru' },
  { key: 'konfirmasi', label: 'Konfirmasi sandi baru' }
]

async function ubahSandi() {
  sandiError.value = ''
  sandiSukses.value = ''

  if (!sandi.value.lama || !sandi.value.baru || !sandi.value.konfirmasi) {
    sandiError.value = 'Semua kolom sandi wajib diisi.'
    return
  }
  if (sandi.value.baru.length < 8) {
    sandiError.value = 'Sandi baru minimal 8 karakter.'
    return
  }
  if (sandi.value.baru !== sandi.value.konfirmasi) {
    sandiError.value = 'Konfirmasi sandi baru tidak cocok.'
    return
  }

  savingSandi.value = true
  try {
    const res = await fetch('/api/pengaturan/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password_lama: sandi.value.lama,
        password_baru: sandi.value.baru
      })
    })
    const json = await res.json()

    if (!res.ok) {
      sandiError.value = json.message || 'Gagal mengubah sandi.'
      return
    }

    sandiSukses.value = 'Sandi berhasil diubah.'
    sandi.value = { lama: '', baru: '', konfirmasi: '' }
  } catch (err) {
    sandiError.value = 'Tidak bisa terhubung ke server.'
  } finally {
    savingSandi.value = false
    setTimeout(() => (sandiSukses.value = ''), 3000)
  }
}

onMounted(async () => {
  await muatAkun()
  await loadFromApi()
})
</script>

<template>
  <div class="w-full max-w-5xl space-y-5">
    <!-- Tab -->
    <nav class="flex gap-1 overflow-x-auto border-b border-ink-100 dark:border-ink-500" aria-label="Bagian pengaturan">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="px-4 py-2.5 text-[13.5px] font-medium whitespace-nowrap border-b-2 -mb-px transition"
        :class="tab === t.key
          ? 'border-brand-500 text-brand-600 dark:text-white'
          : 'border-transparent text-ink-400 hover:text-ink-600 dark:hover:text-ink-100'"
        :aria-current="tab === t.key ? 'page' : undefined"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <!-- ================= USAHA ================= -->
    <section v-show="tab === 'usaha'" :class="cardCls">
      <h2 class="text-[15px] font-semibold dark:text-white mb-1">Data usaha</h2>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">
        Data ini diisi saat registrasi dan bisa diubah kapan saja.
      </p>

      <form class="space-y-4" @submit.prevent="simpanUsaha">
        <!-- Logo -->
        <div class="flex items-center gap-4 pb-4 border-b border-ink-100 dark:border-ink-500">
          <div class="w-16 h-16 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden">
            <img v-if="usaha.logo" :src="usaha.logo" alt="Logo usaha" class="w-full h-full object-cover" />
            <span v-else>{{ (usaha.namaUsaha || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-[13px] font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition disabled:opacity-60"
                :disabled="uploadingLogo"
                @click="triggerLogoInput"
              >
                {{ uploadingLogo ? 'Mengunggah...' : 'Unggah logo' }}
              </button>
              <button
                v-if="usaha.logo"
                type="button"
                class="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-600 transition"
                @click="removeLogo"
              >
                Hapus
              </button>
            </div>
            <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoChange" />
            <p class="text-[12px] text-ink-400 mt-2">JPG atau PNG, maksimal 2MB. Tanpa logo, huruf depan nama usaha dipakai.</p>
            <p v-if="logoError" class="text-[12px] text-danger-600 mt-1">{{ logoError }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div class="sm:col-span-2 lg:col-span-1">
            <label :class="labelCls">Nama usaha</label>
            <input v-model="usaha.namaUsaha" type="text" placeholder="Contoh: Kolam Lele Pak Budi" :class="inputCls" />
          </div>

          <div>
            <label :class="labelCls">Nomor telepon usaha</label>
            <input v-model="usaha.telepon" type="tel" placeholder="08xxxxxxxxxx" :class="inputCls" />
          </div>

          <div class="sm:col-span-2 lg:col-span-1">
            <label :class="labelCls">Satuan hitung</label>
            <div class="flex gap-2">
              <select
                v-model="usaha.satuan"
                :class="[inputCls, usaha.satuan === 'custom' ? '!w-1/2' : '']"
              >
                <option value="ekor">Ekor</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="ton">Ton</option>
                <option value="custom">Lainnya</option>
              </select>
              <input
                v-if="usaha.satuan === 'custom'"
                v-model="usaha.satuanCustom"
                type="text"
                placeholder="Contoh: karung, ikat"
                :class="[inputCls, 'flex-1']"
              />
            </div>
          </div>

          <div class="sm:col-span-2 lg:col-span-3">
            <label :class="labelCls">Alamat lokasi usaha</label>
            <input
              v-model="usaha.alamat"
              type="text"
              placeholder="Contoh: Desa Sukamaju, Kec. Wonoasri, Madiun"
              :class="inputCls"
            />
          </div>
        </div>

        <!-- Komoditas -->
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-2">Jenis komoditas</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              v-for="k in KOMODITAS_PRESET"
              :key="k.value"
              type="button"
              class="relative rounded-lg border p-3 transition text-center select-none"
              :class="isCommoditySelected(k.value)
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-ink-100 dark:border-ink-500 hover:border-ink-300'"
              :aria-pressed="isCommoditySelected(k.value)"
              @click="toggleCommodity(k.value)"
            >
              <span class="text-[13px] font-medium dark:text-white">{{ k.label }}</span>
              <span
                v-if="isCommoditySelected(k.value)"
                class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </button>
          </div>

          <div v-if="isCommoditySelected('custom')" class="mt-3">
            <input
              v-model="usaha.komoditasCustom"
              type="text"
              placeholder="Contoh: Rumput laut, Lobster, Belut"
              :class="inputCls"
            />
          </div>
        </div>

        <div>
          <label :class="labelCls">Deskripsi singkat</label>
          <textarea
            v-model="usaha.deskripsi"
            rows="3"
            placeholder="Contoh: Budidaya lele sistem bioflok, 6 kolam aktif."
            :class="[inputCls, 'resize-none']"
          ></textarea>
        </div>

        <div class="flex items-center gap-3">
          <button type="submit" :disabled="savingUsaha" :class="primaryBtn">
            {{ savingUsaha ? 'Menyimpan...' : 'Simpan perubahan' }}
          </button>
          <span v-if="usahaMsg" class="text-[13px]" :class="usahaMsgError ? 'text-danger-600' : 'text-ok-500'">{{ usahaMsg }}</span>
        </div>
      </form>
    </section>

    <!-- ================= TAMPILAN & MENU ================= -->
    <div v-show="tab === 'tampilan'" class="space-y-5">
      <!-- Nama aplikasi + menu -->
      <section :class="cardCls">
        <h2 class="text-[15px] font-semibold dark:text-white mb-1">Nama aplikasi dan judul halaman</h2>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">
          Nama di sidebar, nama menu, serta judul dan keterangan di bagian atas setiap halaman. Kosongkan kolom untuk memakai teks bawaan.
        </p>

        <form class="space-y-5" @submit.prevent="simpanBranding">
          <div class="max-w-md">
            <label :class="labelCls">Nama aplikasi (judul sidebar)</label>
            <input
              v-model="draft.namaAplikasi"
              type="text"
              maxlength="40"
              :placeholder="NAMA_APLIKASI_BAWAAN"
              :class="inputCls"
            />
            <p class="text-[12px] text-ink-400 mt-1">Juga dipakai sebagai judul tab browser. Maksimal 40 karakter.</p>
          </div>

          <div v-for="[grup, items] in grupMenu" :key="grup">
            <h3 class="text-[13px] font-semibold dark:text-white mb-2">{{ grup }}</h3>
            <div class="rounded-lg border border-ink-100 dark:border-ink-500 divide-y divide-ink-100 dark:divide-ink-500">
              <div
                v-for="m in items"
                :key="m.key"
                class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 p-3"
              >
                <div>
                  <label class="block text-[12px] text-ink-400 mb-1" :for="`label-${m.key}`">Nama menu</label>
                  <input :id="`label-${m.key}`" v-model="draft.labels[m.key]" type="text" maxlength="30" :placeholder="m.bawaan" :class="inputCls" />
                </div>
                <div>
                  <label class="block text-[12px] text-ink-400 mb-1" :for="`sub-${m.key}`">Keterangan di bawah judul halaman</label>
                  <input :id="`sub-${m.key}`" v-model="draft.subtitles[m.key]" type="text" maxlength="120" :placeholder="m.subtitle" :class="inputCls" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button type="submit" :class="primaryBtn">Simpan nama dan judul</button>
            <button type="button" :class="ghostBtn" @click="kembalikanBawaan">Kembalikan ke bawaan</button>
            <span v-if="brandingMsg" class="text-[13px] text-ok-500">{{ brandingMsg }}</span>
          </div>
        </form>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Preferensi -->
        <section :class="cardCls">
          <h2 class="text-[15px] font-semibold dark:text-white mb-1">Preferensi</h2>
          <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Bahasa, zona waktu, dan format mata uang.</p>

          <form class="space-y-3" @submit.prevent="simpanUsaha">
            <div>
              <label :class="labelCls">Bahasa</label>
              <select v-model="usaha.bahasa" :class="inputCls">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label :class="labelCls">Zona waktu</label>
              <select v-model="usaha.zonaWaktu" :class="inputCls">
                <option v-for="z in ZONA_WAKTU_OPTIONS" :key="z.value" :value="z.value">{{ z.label }}</option>
              </select>
            </div>
            <div>
              <label :class="labelCls">Mata uang</label>
              <select v-model="usaha.mataUang" :class="inputCls">
                <option v-for="m in MATA_UANG_OPTIONS" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <button type="submit" :disabled="savingUsaha" :class="primaryBtn">
                {{ savingUsaha ? 'Menyimpan...' : 'Simpan preferensi' }}
              </button>
              <span v-if="usahaMsg" class="text-[13px]" :class="usahaMsgError ? 'text-danger-600' : 'text-ok-500'">{{ usahaMsg }}</span>
            </div>
          </form>
        </section>

        <!-- Mode tampilan -->
        <section :class="[cardCls, 'self-start']">
          <h2 class="text-[15px] font-semibold dark:text-white mb-1">Mode tampilan</h2>
          <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Berlaku langsung di semua halaman.</p>
          <div class="flex items-center justify-between">
            <p class="text-[13.5px] dark:text-ink-100">Mode {{ isDark ? 'gelap' : 'terang' }}</p>
            <button
              type="button"
              role="switch"
              :aria-checked="isDark"
              aria-label="Ganti mode gelap"
              class="w-12 h-6 rounded-full flex items-center px-0.5 transition-colors"
              :class="isDark ? 'bg-brand-500 justify-end' : 'bg-ink-100 dark:bg-ink-500 justify-start'"
              @click="toggle"
            >
              <span class="w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- ================= NOTIFIKASI ================= -->
    <section v-show="tab === 'notifikasi'" :class="cardCls" class="max-w-xl">
      <h2 class="text-[15px] font-semibold dark:text-white mb-1">Notifikasi</h2>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Pilih pemberitahuan yang ingin Anda terima.</p>

      <form class="space-y-4" @submit.prevent="simpanUsaha">
        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Panen sudah waktunya</span>
            <input v-model="usaha.notifPanen" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Stok pakan menipis</span>
            <input v-model="usaha.notifStokRendah" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Pengingat jadwal (makan, obat, sortir, panen, ganti air)</span>
            <input v-model="usaha.notifJadwal" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
        </div>
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="savingUsaha" :class="primaryBtn">
            {{ savingUsaha ? 'Menyimpan...' : 'Simpan notifikasi' }}
          </button>
          <span v-if="usahaMsg" class="text-[13px]" :class="usahaMsgError ? 'text-danger-600' : 'text-ok-500'">{{ usahaMsg }}</span>
        </div>
      </form>
    </section>

    <!-- ================= AKUN ================= -->
    <div v-show="tab === 'akun'" class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <!-- Profil -->
      <section :class="cardCls">
        <h2 class="text-[15px] font-semibold dark:text-white mb-4">Profil</h2>

        <div class="flex items-center gap-4 mb-5 pb-5 border-b border-ink-100 dark:border-ink-500">
          <div class="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-xl shrink-0 overflow-hidden">
            <img v-if="profile.photo" :src="profile.photo" alt="Foto profil" class="w-full h-full object-cover" />
            <span v-else>{{ initials() }}</span>
          </div>
          <div>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-[13px] font-medium px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition disabled:opacity-60"
                :disabled="uploading"
                @click="triggerFileInput"
              >
                {{ uploading ? 'Mengunggah...' : 'Ganti foto' }}
              </button>
              <button
                v-if="profile.photo"
                type="button"
                class="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-600 transition"
                @click="removePhoto"
              >
                Hapus
              </button>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
            <p class="text-[12px] text-ink-400 mt-2">JPG atau PNG, maksimal 2MB.</p>
            <p v-if="uploadError" class="text-[12px] text-danger-600 mt-1">{{ uploadError }}</p>
          </div>
        </div>

        <form class="space-y-3" @submit.prevent="simpanAkun">
          <div>
            <label :class="labelCls">Nama</label>
            <input v-model="akun.nama" type="text" :class="inputCls" />
          </div>
          <div>
            <label :class="labelCls">Email</label>
            <input v-model="akun.email" type="email" :class="inputCls" />
          </div>
          <div class="flex items-center gap-3 pt-1">
            <button type="submit" :disabled="savingAkun" :class="primaryBtn">
              {{ savingAkun ? 'Menyimpan...' : 'Simpan profil' }}
            </button>
            <span v-if="akunMsg" class="text-[13px]" :class="akunMsg.includes('Gagal') ? 'text-danger-600' : 'text-ok-500'">
              {{ akunMsg }}
            </span>
          </div>
        </form>
      </section>

      <!-- Ubah sandi -->
      <section :class="cardCls">
        <h2 class="text-[15px] font-semibold dark:text-white mb-1">Ubah sandi</h2>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Gunakan sandi minimal 8 karakter yang belum pernah dipakai sebelumnya.</p>

        <form class="space-y-3" @submit.prevent="ubahSandi">
          <div v-for="k in kolomSandi" :key="k.key">
            <label :class="labelCls">{{ k.label }}</label>
            <div class="relative">
              <input
                v-model="sandi[k.key]"
                :type="showSandi[k.key] ? 'text' : 'password'"
                :class="[inputCls, 'pr-10']"
                autocomplete="off"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                :aria-label="showSandi[k.key] ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
                @click="showSandi[k.key] = !showSandi[k.key]"
              >
                <NavIcon :name="showSandi[k.key] ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
          </div>

          <p v-if="sandiError" class="text-[13px] text-danger-600">{{ sandiError }}</p>
          <p v-if="sandiSukses" class="text-[13px] text-ok-500">{{ sandiSukses }}</p>

          <button type="submit" :disabled="savingSandi" :class="primaryBtn">
            {{ savingSandi ? 'Menyimpan...' : 'Ubah sandi' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
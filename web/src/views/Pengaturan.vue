<script setup>
import { ref, onMounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { useProfile } from '../composables/useProfile.js'
import {
  useBusinessSettings,
  KOMODITAS_PRESET,
  ZONA_WAKTU_OPTIONS,
  MATA_UANG_OPTIONS
} from '../composables/useBusinessSettings.js'
import NavIcon from '../components/NavIcon.vue'

const { isDark, toggle } = useTheme()
const { profile, initials, handleFileSelect, removePhoto, updateProfile } = useProfile()
const {
  settings: usaha,
  updateSettings: updateUsaha,
  setKomoditas,
  handleLogoSelect,
  removeLogo
} = useBusinessSettings()

// ===== Usaha / Komoditas =====
const savingUsaha = ref(false)
const usahaMsg = ref('')
const logoInput = ref(null)
const logoError = ref('')
const uploadingLogo = ref(false)

function simpanUsaha() {
  savingUsaha.value = true
  updateUsaha({ ...usaha.value })
  usahaMsg.value = 'Pengaturan usaha disimpan.'
  savingUsaha.value = false
  setTimeout(() => (usahaMsg.value = ''), 3000)
}

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
    await fetch('/api/pengaturan/akun', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(akun.value)
    })
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

// ===== Ubah Sandi =====
const sandi = ref({ lama: '', baru: '', konfirmasi: '' })
const showSandi = ref({ lama: false, baru: false, konfirmasi: false })
const savingSandi = ref(false)
const sandiError = ref('')
const sandiSukses = ref('')

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

onMounted(muatAkun)
</script>

<template>
  <!--
    PERBAIKAN LAYOUT:
    - "max-w-3xl" dihapus -> tidak lagi membatasi lebar konten (penyebab area kosong di kanan).
    - "w-full" ditambahkan supaya konten mengisi penuh ruang yang tersedia dari parent layout.
    - Section-section kecil (Preferensi, Notifikasi, Profil, Tampilan, Ubah Sandi) disusun
      dalam grid 2 kolom di layar besar (lg ke atas) supaya halaman terisi rapi,
      sementara "Pengaturan usaha" tetap full-width karena field-nya paling banyak.
  -->
  <div class="w-full space-y-6">
    <!-- Usaha / Komoditas (full width) -->
    <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5 w-full">
      <h2 class="text-[15px] font-semibold dark:text-white mb-1">Pengaturan usaha</h2>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">
        Sesuaikan aplikasi dengan jenis usaha budidaya kamu — ikan, udang, kepiting, atau lainnya.
      </p>

      <form class="space-y-3" @submit.prevent="simpanUsaha">
        <!-- Logo -->
        <div class="flex items-center gap-4 pb-4 mb-1 border-b border-ink-100 dark:border-ink-500">
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
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama usaha</label>
            <input
              v-model="usaha.namaUsaha"
              type="text"
              placeholder="Contoh: Tambak Udang Pak Budi"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
            <p class="text-[12px] text-ink-400 mt-1">Nama ini akan tampil di logo dan judul aplikasi.</p>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis komoditas</label>
            <select
              :value="usaha.komoditas"
              @change="setKomoditas($event.target.value)"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            >
              <option v-for="k in KOMODITAS_PRESET" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
          </div>

          <div v-if="usaha.komoditas === 'custom'">
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama komoditas</label>
            <input
              v-model="usaha.komoditasCustom"
              type="text"
              placeholder="Contoh: Rumput laut, Lobster, Belut"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Satuan hitung</label>
            <div class="flex gap-2">
              <select
                v-model="usaha.satuan"
                class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
                :class="usaha.satuan === 'custom' ? 'w-1/2' : 'w-full'"
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
                class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <p class="text-[12px] text-ink-400 mt-1">Misal "0 {{ usaha.satuan === 'custom' ? (usaha.satuanCustom || 'unit') : usaha.satuan }}".</p>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nomor telepon usaha</label>
            <input
              v-model="usaha.telepon"
              type="tel"
              placeholder="08xxxxxxxxxx"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>

          <div class="sm:col-span-2 lg:col-span-2">
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Alamat lokasi usaha</label>
            <input
              v-model="usaha.alamat"
              type="text"
              placeholder="Contoh: Desa Sukamaju, Kec. Wonoasri, Madiun"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
        </div>

        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Deskripsi singkat</label>
          <textarea
            v-model="usaha.deskripsi"
            rows="3"
            placeholder="Contoh: Budidaya udang vaname sistem bioflok, 6 kolam aktif."
            class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] resize-none"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 pt-1">
          <button type="submit" :disabled="savingUsaha" class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60">
            {{ savingUsaha ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <span v-if="usahaMsg" class="text-[13px] text-ok-500">{{ usahaMsg }}</span>
        </div>
      </form>
    </section>

    <!-- Grid 2 kolom untuk section-section yang lebih kecil -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Preferensi Aplikasi -->
      <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <h2 class="text-[15px] font-semibold dark:text-white mb-1">Preferensi aplikasi</h2>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Atur bahasa, zona waktu, dan format mata uang.</p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Bahasa</label>
            <select
              v-model="usaha.bahasa"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Zona waktu</label>
            <select
              v-model="usaha.zonaWaktu"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            >
              <option v-for="z in ZONA_WAKTU_OPTIONS" :key="z.value" :value="z.value">{{ z.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Mata uang</label>
            <select
              v-model="usaha.mataUang"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            >
              <option v-for="m in MATA_UANG_OPTIONS" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Notifikasi -->
      <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <h2 class="text-[15px] font-semibold dark:text-white mb-1">Notifikasi</h2>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Pilih notifikasi apa saja yang ingin kamu terima.</p>

        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Panen siap dipanen</span>
            <input v-model="usaha.notifPanen" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Stok / pakan menipis</span>
            <input v-model="usaha.notifStokRendah" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-[13.5px] dark:text-ink-100">Pengingat jadwal (sortir, panen, dll)</span>
            <input v-model="usaha.notifJadwal" type="checkbox" class="w-4 h-4 accent-brand-500" />
          </label>
        </div>
      </section>

      <!-- Profil -->
      <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <h2 class="text-[15px] font-semibold dark:text-white mb-4">Profil</h2>

        <!-- Foto -->
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

        <!-- Data akun -->
        <form class="space-y-3" @submit.prevent="simpanAkun">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama</label>
              <input v-model="akun.nama" type="text" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Email</label>
              <input v-model="akun.email" type="email" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
          </div>
          <div class="flex items-center gap-3 pt-1">
            <button type="submit" :disabled="savingAkun" class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60">
              {{ savingAkun ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <span v-if="akunMsg" class="text-[13px]" :class="akunMsg.includes('Gagal') ? 'text-danger-600' : 'text-ok-500'">
              {{ akunMsg }}
            </span>
          </div>
        </form>
      </section>

      <!-- Tampilan + Ubah Sandi digabung dalam satu kolom -->
      <div class="space-y-6">
        <!-- Tampilan -->
        <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <h2 class="text-[15px] font-semibold dark:text-white mb-4">Tampilan</h2>
          <div class="flex items-center justify-between">
            <p class="text-[13.5px] dark:text-ink-100">Mode {{ isDark ? 'Gelap' : 'Terang' }}</p>
            <button
              type="button"
              class="w-12 h-6 rounded-full flex items-center px-0.5 transition-colors"
              :class="isDark ? 'bg-brand-500 justify-end' : 'bg-ink-100 dark:bg-ink-500 justify-start'"
              @click="toggle"
            >
              <span class="w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
        </section>

        <!-- Ubah Sandi -->
        <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <h2 class="text-[15px] font-semibold dark:text-white mb-1">Ubah sandi</h2>
          <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Gunakan sandi minimal 8 karakter yang belum pernah dipakai sebelumnya.</p>

          <form class="space-y-3" @submit.prevent="ubahSandi">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Sandi saat ini</label>
              <div class="relative">
                <input
                  v-model="sandi.lama"
                  :type="showSandi.lama ? 'text' : 'password'"
                  class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 pr-10 text-[13.5px]"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" tabindex="-1" @click="showSandi.lama = !showSandi.lama">
                  <NavIcon :name="showSandi.lama ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Sandi baru</label>
              <div class="relative">
                <input
                  v-model="sandi.baru"
                  :type="showSandi.baru ? 'text' : 'password'"
                  class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 pr-10 text-[13.5px]"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" tabindex="-1" @click="showSandi.baru = !showSandi.baru">
                  <NavIcon :name="showSandi.baru ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Konfirmasi sandi baru</label>
              <div class="relative">
                <input
                  v-model="sandi.konfirmasi"
                  :type="showSandi.konfirmasi ? 'text' : 'password'"
                  class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 pr-10 text-[13.5px]"
                />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600" tabindex="-1" @click="showSandi.konfirmasi = !showSandi.konfirmasi">
                  <NavIcon :name="showSandi.konfirmasi ? 'eye-off' : 'eye'" :size="16" />
                </button>
              </div>
            </div>

            <p v-if="sandiError" class="text-[13px] text-danger-600">{{ sandiError }}</p>
            <p v-if="sandiSukses" class="text-[13px] text-ok-500">{{ sandiSukses }}</p>

            <button type="submit" :disabled="savingSandi" class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60">
              {{ savingSandi ? 'Menyimpan...' : 'Ubah sandi' }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
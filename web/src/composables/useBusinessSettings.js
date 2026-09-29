import { ref, computed } from 'vue'

export const KOMODITAS_PRESET = [
  { value: 'ikan', label: 'Ikan', satuanDefault: 'ekor' },
  { value: 'udang', label: 'Udang', satuanDefault: 'kg' },
  { value: 'kepiting', label: 'Kepiting', satuanDefault: 'ekor' },
  { value: 'lele', label: 'Lele', satuanDefault: 'kg' },
  { value: 'custom', label: 'Lainnya', satuanDefault: 'ekor' }
]

const defaultSettings = {
  logo: null,
  namaUsaha: 'Usaha Saya',
  // Multi komoditas (konsisten dengan registrasi)
  commodities: [], // [{ key: 'ikan', label: 'Ikan', initialPools: 2 }, ...]
  komoditasCustom: '',
  satuan: 'ekor',
  satuanCustom: '',
  alamat: '',
  telepon: '',
  deskripsi: '',

  // Preferensi
  bahasa: 'id',
  zonaWaktu: 'Asia/Jakarta',
  mataUang: 'IDR',

  // Notifikasi
  notifPanen: true,
  notifStokRendah: true,
  notifJadwal: true
}

// Pengaturan usaha sekarang disimpan di server (per akun), bukan di localStorage browser.
const settings = ref({ ...defaultSettings })

// Hapus sisa data lama di browser ini (dulu dipakai bersama semua akun)
try {
  localStorage.removeItem('business_settings')
} catch (e) {
  // abaikan
}

export const ZONA_WAKTU_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
  { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' }
]

export const MATA_UANG_OPTIONS = [
  { value: 'IDR', label: 'Rupiah (Rp)' },
  { value: 'USD', label: 'US Dollar ($)' }
]

// ===== API Sync =====
async function loadFromApi() {
  try {
    const res = await fetch('/api/pengaturan/usaha')
    if (!res.ok) return

    const json = await res.json()
    settings.value = { ...defaultSettings, ...(json.data || {}) }
  } catch (e) {
    console.warn('Gagal load pengaturan dari server:', e.message)
  }
}

// Melempar error kalau gagal, supaya halaman Pengaturan bisa menampilkan pesan gagal
async function saveToApi() {
  const res = await fetch('/api/pengaturan/usaha', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings.value)
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message || 'Gagal menyimpan pengaturan usaha')
  }
}

// Kosongkan pengaturan di memori (dipanggil saat keluar / ganti akun)
function resetSettings() {
  settings.value = { ...defaultSettings }
}

export function useBusinessSettings() {
  // Label gabungan, contoh: "Ikan, Udang"
  const komoditasLabel = computed(() => {
    if (!settings.value.commodities?.length) return 'Komoditas'
    return settings.value.commodities
      .map((c) => (c.key === 'custom' ? settings.value.komoditasCustom || c.label : c.label))
      .filter(Boolean)
      .join(', ')
  })

  const satuanLabel = computed(() => {
    return settings.value.satuan === 'custom'
      ? settings.value.satuanCustom || 'unit'
      : settings.value.satuan
  })

  // Total kolam awal dari semua komoditas
  const totalInitialPools = computed(() =>
    (settings.value.commodities || []).reduce((sum, c) => sum + (Number(c.initialPools) || 0), 0)
  )

  function updateSettings(data) {
    settings.value = { ...settings.value, ...data }
  }

  // Dipakai setelah registrasi sukses.
  // Mulai dari nilai bawaan (bukan dari data akun sebelumnya), lalu simpan ke server.
  function setFromRegistration({ name, address, phone, commodities = [] }) {
    settings.value = {
      ...defaultSettings,
      namaUsaha: name || defaultSettings.namaUsaha,
      alamat: address || '',
      telepon: phone || '',
      commodities: commodities.map((c) => ({
        key: c.key,
        label: c.label,
        initialPools: Number(c.initialPools) || 0
      }))
    }

    // Set satuan default berdasarkan komoditas pertama
    if (commodities.length > 0) {
      const first = KOMODITAS_PRESET.find((k) => k.value === commodities[0].key)
      if (first) settings.value.satuan = first.satuanDefault
    }

    saveToApi().catch((e) => console.warn('Gagal menyimpan data registrasi:', e.message))
  }

  // Toggle komoditas (untuk UI multi-select)
  function toggleCommodity(key) {
    const list = settings.value.commodities || []
    const idx = list.findIndex((c) => c.key === key)

    if (idx === -1) {
      const preset = KOMODITAS_PRESET.find((k) => k.value === key)
      list.push({
        key,
        label: preset?.label || key,
        initialPools: 1
      })
    } else {
      list.splice(idx, 1)
    }
    settings.value.commodities = [...list]
  }

  function isCommoditySelected(key) {
    return (settings.value.commodities || []).some((c) => c.key === key)
  }

  function updatePoolCount(key, count) {
    const item = (settings.value.commodities || []).find((c) => c.key === key)
    if (item) item.initialPools = Number(count) || 0
  }

  // Upload logo (langsung disimpan ke server)
  function handleLogoSelect(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Tidak ada file dipilih'))
      if (!file.type.startsWith('image/')) {
        return reject(new Error('File harus berupa gambar'))
      }
      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('Ukuran gambar maksimal 2MB'))
      }
      const reader = new FileReader()
      reader.onload = async () => {
        const lama = settings.value.logo
        settings.value.logo = reader.result
        try {
          await saveToApi()
          resolve(reader.result)
        } catch (err) {
          settings.value.logo = lama
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
      reader.readAsDataURL(file)
    })
  }

  function removeLogo() {
    const lama = settings.value.logo
    settings.value.logo = null
    saveToApi().catch((e) => {
      console.error(e)
      settings.value.logo = lama
    })
  }

  return {
    settings,
    komoditasLabel,
    satuanLabel,
    totalInitialPools,
    updateSettings,
    setFromRegistration,
    toggleCommodity,
    isCommoditySelected,
    updatePoolCount,
    handleLogoSelect,
    removeLogo,
    loadFromApi,
    saveToApi,
    resetSettings,
    KOMODITAS_PRESET
  }
}
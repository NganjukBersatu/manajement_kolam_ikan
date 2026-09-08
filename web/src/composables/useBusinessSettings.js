import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'business_settings'

// Preset komoditas umum. "custom" memungkinkan pengguna menulis jenis usahanya sendiri
// kalau tidak ada di daftar (misal: lele, gurame, lobster, rumput laut, dst).
export const KOMODITAS_PRESET = [
  { value: 'ikan', label: 'Ikan', satuanDefault: 'ekor' },
  { value: 'udang', label: 'Udang', satuanDefault: 'kg' },
  { value: 'kepiting', label: 'Kepiting', satuanDefault: 'ekor' },
  { value: 'lele', label: 'Lele', satuanDefault: 'kg' },
  { value: 'custom', label: 'Lainnya', satuanDefault: 'ekor' }
]

const defaultSettings = {
  logo: null,               // base64 gambar logo usaha, atau null (pakai inisial nama)
  namaUsaha: 'Usaha Saya',
  komoditas: 'ikan',        // salah satu value di KOMODITAS_PRESET
  komoditasCustom: '',      // dipakai kalau komoditas === 'custom'
  satuan: 'ekor',           // ekor, kg, ton, atau satuan custom
  satuanCustom: '',
  alamat: '',
  telepon: '',
  deskripsi: '',

  // Preferensi aplikasi
  bahasa: 'id',              // id, en
  zonaWaktu: 'Asia/Jakarta', // WIB, WITA, WIT
  mataUang: 'IDR',           // IDR, USD

  // Notifikasi
  notifPanen: true,
  notifStokRendah: true,
  notifJadwal: true
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch (e) {
    console.error('Gagal memuat pengaturan usaha:', e)
  }
  return { ...defaultSettings }
}

const settings = ref(loadSettings())

watch(
  settings,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Gagal menyimpan pengaturan usaha:', e)
    }
  },
  { deep: true }
)

export const ZONA_WAKTU_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'WIB (Jakarta)' },
  { value: 'Asia/Makassar', label: 'WITA (Makassar)' },
  { value: 'Asia/Jayapura', label: 'WIT (Jayapura)' }
]

export const MATA_UANG_OPTIONS = [
  { value: 'IDR', label: 'Rupiah (Rp)' },
  { value: 'USD', label: 'US Dollar ($)' }
]

export function useBusinessSettings() {
  // Label komoditas yang siap ditampilkan, misal untuk judul "Total {{ label }} hidup"
  const komoditasLabel = computed(() => {
    if (settings.value.komoditas === 'custom') {
      return settings.value.komoditasCustom || 'Komoditas'
    }
    const preset = KOMODITAS_PRESET.find((k) => k.value === settings.value.komoditas)
    return preset?.label || 'Komoditas'
  })

  const satuanLabel = computed(() => {
    return settings.value.satuan === 'custom'
      ? settings.value.satuanCustom || 'unit'
      : settings.value.satuan
  })

  function updateSettings(data) {
    settings.value = { ...settings.value, ...data }
  }

  // Set satuan default begitu jenis komoditas diganti, kecuali user sudah pernah ubah manual
  function setKomoditas(value) {
    const preset = KOMODITAS_PRESET.find((k) => k.value === value)
    settings.value.komoditas = value
    if (preset && preset.value !== 'custom') {
      settings.value.satuan = preset.satuanDefault
    }
  }

  // Upload logo usaha (base64), dengan validasi tipe dan ukuran file
  function handleLogoSelect(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Tidak ada file dipilih'))
      if (!file.type.startsWith('image/')) {
        return reject(new Error('File harus berupa gambar'))
      }
      const maxSizeMB = 2
      if (file.size > maxSizeMB * 1024 * 1024) {
        return reject(new Error(`Ukuran gambar maksimal ${maxSizeMB}MB`))
      }
      const reader = new FileReader()
      reader.onload = () => {
        settings.value.logo = reader.result
        resolve(reader.result)
      }
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
      reader.readAsDataURL(file)
    })
  }

  function removeLogo() {
    settings.value.logo = null
  }

  return {
    settings,
    komoditasLabel,
    satuanLabel,
    updateSettings,
    setKomoditas,
    handleLogoSelect,
    removeLogo
  }
}
import { ref, watch } from 'vue'

const STORAGE_KEY = 'profile_data'

const defaultProfile = {
  name: 'Admin',
  role: 'Administrator',
  email: '',
  photo: null // base64 string atau null (pakai inisial)
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) }
  } catch (e) {
    console.error('Gagal memuat data profil:', e)
  }
  return { ...defaultProfile }
}

const profile = ref(loadProfile())

watch(
  profile,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Gagal menyimpan data profil:', e)
    }
  },
  { deep: true }
)

export function useProfile() {
  function setPhoto(base64) {
    profile.value.photo = base64
  }

  function removePhoto() {
    profile.value.photo = null
  }

  function updateProfile(data) {
    profile.value = { ...profile.value, ...data }
  }

  function initials() {
    const name = profile.value.name || ''
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'A'
  }

  // Baca file gambar yang dipilih user, konversi ke base64, lalu validasi ukuran/tipe
  function handleFileSelect(file) {
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
        setPhoto(reader.result)
        resolve(reader.result)
      }
      reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
      reader.readAsDataURL(file)
    })
  }

  return {
    profile,
    setPhoto,
    removePhoto,
    updateProfile,
    initials,
    handleFileSelect
  }
}
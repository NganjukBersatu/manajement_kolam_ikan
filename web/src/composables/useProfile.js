import { ref } from 'vue'

// Data profil sekarang disimpan di server (per akun), bukan di localStorage browser.
const defaultProfile = {
  name: '',
  username: '',
  role: 'Administrator',
  email: '',
  photo: null // base64 string atau null (pakai inisial)
}

const profile = ref({ ...defaultProfile })

// Hapus sisa data lama di browser ini (dulu dipakai bersama semua akun)
try {
  localStorage.removeItem('profile_data')
} catch (e) {
  // abaikan
}

// Ambil profil akun yang sedang login dari server
async function muatProfil() {
  try {
    const res = await fetch('/api/pengaturan/akun')
    if (!res.ok) return
    const json = await res.json()
    const d = json.data || {}
    profile.value = {
      ...defaultProfile,
      name: d.nama || d.username || '',
      username: d.username || '',
      email: d.email || '',
      photo: d.foto || null
    }
  } catch (e) {
    console.warn('Gagal memuat profil dari server:', e.message)
  }
}

// Kosongkan profil di memori (dipanggil saat keluar / ganti akun)
function resetProfile() {
  profile.value = { ...defaultProfile }
}

async function simpanFoto(foto) {
  const res = await fetch('/api/pengaturan/akun/foto', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foto })
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.message || 'Gagal menyimpan foto')
  }
}

export function useProfile() {
  function setPhoto(base64) {
    profile.value.photo = base64
  }

  function removePhoto() {
    const lama = profile.value.photo
    profile.value.photo = null
    simpanFoto(null).catch((e) => {
      console.error(e)
      profile.value.photo = lama
    })
  }

  function updateProfile(data) {
    const baru = { ...data }
    // Nama kosong → pakai username akun
    if ('name' in baru && !baru.name) baru.name = profile.value.username
    profile.value = { ...profile.value, ...baru }
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

  // Baca file gambar yang dipilih user, konversi ke base64, validasi, lalu simpan ke server
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
      reader.onload = async () => {
        const lama = profile.value.photo
        setPhoto(reader.result)
        try {
          await simpanFoto(reader.result)
          resolve(reader.result)
        } catch (err) {
          profile.value.photo = lama
          reject(err)
        }
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
    handleFileSelect,
    muatProfil,
    resetProfile
  }
}
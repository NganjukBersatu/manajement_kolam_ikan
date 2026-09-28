import { reactive, watch } from 'vue'

// Simpan di src/composables/useAppBranding.js
// `key` sama dengan meta.key di router (lihat catatan di jawaban).
// Ganti `subtitle` bawaan dengan teks yang sudah Anda pakai di tiap halaman.
export const MENU_ITEMS = [
  { key: 'dashboard', group: 'Menu utama', bawaan: 'Dashboard', subtitle: 'Ringkasan kondisi kolam dan usaha Anda' },
  { key: 'transaksi', group: 'Menu utama', bawaan: 'Transaksi', subtitle: 'Catatan penjualan dan pembelian' },
  { key: 'kolam', group: 'Menu utama', bawaan: 'Daftar Kolam', subtitle: 'Daftar kolam dan kondisinya' },
  { key: 'jenis-ikan', group: 'Menu utama', bawaan: 'Jenis Ikan', subtitle: 'Daftar jenis ikan yang dibudidayakan' },
  { key: 'jadwal', group: 'Jadwal', bawaan: 'Jadwal', subtitle: 'Semua jadwal kegiatan kolam' },
  { key: 'pemberian-makan', group: 'Jadwal', bawaan: 'Pemberian Makan', subtitle: 'Jadwal dan riwayat pemberian makan' },
  { key: 'pemberian-obat', group: 'Jadwal', bawaan: 'Pemberian Obat', subtitle: 'Jadwal dan riwayat pemberian obat' },
  { key: 'sortir', group: 'Jadwal', bawaan: 'Sortir', subtitle: 'Jadwal dan riwayat sortir ikan' },
  { key: 'panen', group: 'Jadwal', bawaan: 'Panen', subtitle: 'Jadwal dan hasil panen' },
  { key: 'ganti-air', group: 'Jadwal', bawaan: 'Ganti Air', subtitle: 'Jadwal dan riwayat penggantian air' },
  { key: 'pengeluaran', group: 'Lainnya', bawaan: 'Pengeluaran', subtitle: 'Catatan biaya operasional' },
  { key: 'stok-pakan', group: 'Lainnya', bawaan: 'Stok Pakan', subtitle: 'Daftar jenis pakan, sisa stok, dan riwayat aktivitas pemakaian pakan' },
  { key: 'laporan', group: 'Laporan', bawaan: 'Laporan', subtitle: 'Semua laporan usaha Anda' },
  { key: 'laporan-ringkasan', group: 'Laporan', bawaan: 'Ringkasan', subtitle: 'Ringkasan laporan usaha' },
  { key: 'laporan-penjualan', group: 'Laporan', bawaan: 'Penjualan', subtitle: 'Laporan penjualan' },
  { key: 'laporan-pengeluaran', group: 'Laporan', bawaan: 'Pengeluaran', subtitle: 'Laporan pengeluaran' },
  { key: 'laporan-panen', group: 'Laporan', bawaan: 'Panen', subtitle: 'Laporan hasil panen' },
  { key: 'pengaturan', group: 'Lainnya', bawaan: 'Pengaturan', subtitle: 'Atur usaha, tampilan, notifikasi, dan akun' }
]

export const NAMA_APLIKASI_BAWAAN = 'Manajemen Kolam'
const STORAGE_KEY = 'app-branding'

function muat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saved = muat()

// Satu state untuk seluruh aplikasi (singleton), jadi sidebar, header,
// dan halaman Pengaturan otomatis ikut berubah bersamaan.
const branding = reactive({
  namaAplikasi: saved.namaAplikasi || NAMA_APLIKASI_BAWAAN,
  labels: { ...(saved.labels || {}) },
  subtitles: { ...(saved.subtitles || {}) }
})

function bersihkan(obj) {
  const hasil = {}
  for (const [k, v] of Object.entries(obj || {})) {
    if (typeof v === 'string' && v.trim()) hasil[k] = v.trim()
  }
  return hasil
}

watch(
  () => branding.namaAplikasi,
  (nama) => {
    document.title = nama
  },
  { immediate: true }
)

export function useAppBranding() {
  function label(key) {
    const item = MENU_ITEMS.find((m) => m.key === key)
    return branding.labels[key] || item?.bawaan || ''
  }

  function subtitle(key) {
    const item = MENU_ITEMS.find((m) => m.key === key)
    return branding.subtitles[key] || item?.subtitle || ''
  }

  function saveBranding(draft) {
    branding.namaAplikasi = (draft.namaAplikasi || '').trim() || NAMA_APLIKASI_BAWAAN
    branding.labels = bersihkan(draft.labels)
    branding.subtitles = bersihkan(draft.subtitles)
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          namaAplikasi: branding.namaAplikasi,
          labels: branding.labels,
          subtitles: branding.subtitles
        })
      )
    } catch (err) {
      console.error('Gagal menyimpan tampilan:', err)
    }
  }

  function resetBranding() {
    saveBranding({ namaAplikasi: NAMA_APLIKASI_BAWAAN, labels: {}, subtitles: {} })
  }

  return { branding, MENU_ITEMS, label, subtitle, saveBranding, resetBranding }
}
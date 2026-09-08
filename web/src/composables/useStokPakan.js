/**
 * ============================================================================
 * KONTRAK API — Stok Pakan
 * ============================================================================
 *
 * GET    /api/stok-pakan
 * POST   /api/stok-pakan          body: { nama, satuan, stokAwal, stokMinimum }
 * PUT    /api/stok-pakan/:id      body: { nama, satuan, stokMinimum }
 * DELETE /api/stok-pakan/:id
 * ============================================================================
 */

import { ref, computed } from 'vue'

// State module-level -> singleton
const jenisPakan = ref([])
const riwayat = ref([])
const riwayatHasMore = ref(false)
const loadingJenis = ref(false)
const loadingRiwayat = ref(false)
const error = ref('')

export const SATUAN_PAKAN_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'sak', label: 'Sak' },
  { value: 'karung', label: 'Karung' },
  { value: 'custom', label: 'Lainnya' }
]

export function useStokPakan() {
  // ===== Muat data =====
  async function muatJenisPakan() {
    loadingJenis.value = true
    error.value = ''
    try {
      const res = await fetch('/api/stok-pakan')
      if (!res.ok) throw new Error('Gagal memuat data stok pakan.')
      const json = await res.json()
      jenisPakan.value = json.data || []
    } catch (err) {
      error.value = err.message || 'Gagal memuat data stok pakan.'
    } finally {
      loadingJenis.value = false
    }
  }

  async function muatRiwayat(filter = {}) {
    // Sementara dikosongkan dulu (endpoint riwayat belum ada)
    loadingRiwayat.value = true
    try {
      riwayat.value = []
      riwayatHasMore.value = false
    } finally {
      loadingRiwayat.value = false
    }
  }

  // ===== CRUD jenis pakan =====
  async function tambahJenisPakan(payload) {
    const body = {
      nama: payload.nama,
      satuan: payload.satuan || 'kg',
      stokAwal: payload.stokAwal ?? payload.stok ?? 0,
      stokMinimum: payload.stokMinimum ?? 10
    }

    const res = await fetch('/api/stok-pakan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal menambah jenis pakan.')
    
    jenisPakan.value.push(json.data)
    return json.data
  }

  async function ubahJenisPakan(id, payload) {
    const body = {
      nama: payload.nama,
      satuan: payload.satuan,
      stokMinimum: payload.stokMinimum
    }

    const res = await fetch(`/api/stok-pakan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal mengubah jenis pakan.')

    const idx = jenisPakan.value.findIndex((p) => p.id === id)
    if (idx !== -1) jenisPakan.value[idx] = json.data
    return json.data
  }

  async function hapusJenisPakan(id) {
    const res = await fetch(`/api/stok-pakan/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal menghapus jenis pakan.')
    }
    jenisPakan.value = jenisPakan.value.filter((p) => p.id !== id)
  }

  // ===== Transaksi stok (sementara belum diimplementasi di backend) =====
  async function catatStokMasuk(pakanId, payload) {
    throw new Error('Fitur stok masuk belum tersedia')
  }

  async function catatStokKeluar(pakanId, payload) {
    throw new Error('Fitur stok keluar belum tersedia')
  }

  // ===== Computed =====
  const pakanMenipis = computed(() =>
    jenisPakan.value.filter((p) => Number(p.stokSaatIni) <= Number(p.stokMinimum))
  )

  const totalJenisPakan = computed(() => jenisPakan.value.length)

  return {
    // state
    jenisPakan,
    riwayat,
    riwayatHasMore,
    loadingJenis,
    loadingRiwayat,
    error,
    // computed
    pakanMenipis,
    totalJenisPakan,
    // actions
    muatJenisPakan,
    muatRiwayat,
    tambahJenisPakan,
    ubahJenisPakan,
    hapusJenisPakan,
    catatStokMasuk,
    catatStokKeluar
  }
}
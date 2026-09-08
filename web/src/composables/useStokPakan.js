/**
 * ============================================================================
 * KONTRAK API — backend perlu menyediakan endpoint berikut (silakan sesuaikan
 * prefix /api/pakan dengan konvensi routing kamu):
 * ============================================================================
 *
 * GET  /api/pakan
 *   -> { data: [ { id, nama, merek, satuan, stokSaatIni, stokMinimum, createdAt } ] }
 *
 * POST /api/pakan                body: { nama, merek, satuan, satuanCustom, stokAwal, stokMinimum }
 *   -> { data: { id, nama, merek, satuan, stokSaatIni, stokMinimum, createdAt } }
 *
 * PUT  /api/pakan/:id             body: { nama, merek, satuan, satuanCustom, stokMinimum }
 *   -> { data: { ...jenisPakan diperbarui... } }
 *   (catatan: endpoint ini TIDAK mengubah stokSaatIni — perubahan stok hanya
 *    lewat transaksi masuk/keluar supaya ada jejak audit)
 *
 * DELETE /api/pakan/:id
 *   -> 204 No Content (atau { message })
 *
 * POST /api/pakan/:id/masuk       body: { jumlah, tanggal, hargaSatuan, supplier, catatan }
 *   -> { data: { stokSaatIni, transaksi: { id, pakanId, tipe:'masuk', jumlah, tanggal, hargaSatuan, supplier, catatan, createdAt } } }
 *
 * POST /api/pakan/:id/keluar      body: { jumlah, tanggal, catatan }
 *   -> { data: { stokSaatIni, transaksi: { id, pakanId, tipe:'keluar', jumlah, tanggal, catatan, createdAt } } }
 *
 * GET  /api/pakan/riwayat?pakanId=&tipe=&dari=&sampai=&limit=&offset=
 *   -> { data: [ { id, pakanId, namaPakan, tipe, jumlah, satuan, tanggal, hargaSatuan, supplier, catatan, createdAt } ], hasMore }
 *
 * ============================================================================
 */

import { ref, computed } from 'vue'

// State module-level -> singleton, dipakai bersama di seluruh aplikasi
// (pola yang sama seperti useBusinessSettings.js)
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
      const res = await fetch('/api/pakan')
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
    loadingRiwayat.value = true
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== '' && v != null))
      )
      const qs = params.toString()
      const res = await fetch(`/api/pakan/riwayat${qs ? '?' + qs : ''}`)
      if (!res.ok) throw new Error('Gagal memuat riwayat transaksi.')
      const json = await res.json()
      riwayat.value = json.data || []
      riwayatHasMore.value = !!json.hasMore
    } catch (err) {
      error.value = err.message || 'Gagal memuat riwayat transaksi.'
    } finally {
      loadingRiwayat.value = false
    }
  }

  // ===== CRUD jenis pakan =====
  async function tambahJenisPakan(payload) {
    const res = await fetch('/api/pakan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal menambah jenis pakan.')
    jenisPakan.value.push(json.data)
    return json.data
  }

  async function ubahJenisPakan(id, payload) {
    const res = await fetch(`/api/pakan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal mengubah jenis pakan.')
    const idx = jenisPakan.value.findIndex((p) => p.id === id)
    if (idx !== -1) jenisPakan.value[idx] = json.data
    return json.data
  }

  async function hapusJenisPakan(id) {
    const res = await fetch(`/api/pakan/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json.message || 'Gagal menghapus jenis pakan.')
    }
    jenisPakan.value = jenisPakan.value.filter((p) => p.id !== id)
  }

  // ===== Transaksi stok =====
  async function catatStokMasuk(pakanId, payload) {
    const res = await fetch(`/api/pakan/${pakanId}/masuk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal mencatat stok masuk.')

    const idx = jenisPakan.value.findIndex((p) => p.id === pakanId)
    if (idx !== -1) jenisPakan.value[idx].stokSaatIni = json.data.stokSaatIni
    if (json.data.transaksi) riwayat.value.unshift(json.data.transaksi)
    return json.data
  }

  async function catatStokKeluar(pakanId, payload) {
    const res = await fetch(`/api/pakan/${pakanId}/keluar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Gagal mencatat stok keluar.')

    const idx = jenisPakan.value.findIndex((p) => p.id === pakanId)
    if (idx !== -1) jenisPakan.value[idx].stokSaatIni = json.data.stokSaatIni
    if (json.data.transaksi) riwayat.value.unshift(json.data.transaksi)
    return json.data
  }

  // ===== Turunan (computed) =====
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
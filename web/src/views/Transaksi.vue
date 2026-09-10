<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const daftar = ref([])
const daftarJenisIkan = ref([])
const daftarKolam = ref([])
const loading = ref(true)
const showForm = ref(false)
const menyimpan = ref(false)
const editingId = ref(null)

const kosongForm = () => ({
  tanggal: new Date().toISOString().slice(0, 10),
  jenis_ikan_id: '',
  kolam_id: '',
  jumlah_kg: '',
  harga_per_kg: '',
  nama_pembeli: '',
  no_hp: '',
  catatan: ''
})
const form = ref(kosongForm())

// ====================== FILTER ======================
const filterPeriode = ref('semua')
const customDari = ref('')
const customSampai = ref('')
const filterJenisIkan = ref('')
const filterKolam = ref('')
const pencarian = ref('')

// ====================== PAGINATION ======================
const halamanSekarang = ref(1)
const perHalaman = ref(10)

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

const rentangTanggal = computed(() => {
  const sekarang = new Date()

  if (filterPeriode.value === 'hari-ini') {
    return { dari: startOfDay(sekarang), sampai: endOfDay(sekarang) }
  }

  if (filterPeriode.value === 'minggu-ini') {
    const hari = sekarang.getDay()
    const senin = new Date(sekarang)
    senin.setDate(sekarang.getDate() - (hari === 0 ? 6 : hari - 1))
    const minggu = new Date(senin)
    minggu.setDate(senin.getDate() + 6)
    return { dari: startOfDay(senin), sampai: endOfDay(minggu) }
  }

  if (filterPeriode.value === 'bulan-ini') {
    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1)
    const akhirBulan = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0)
    return { dari: startOfDay(awalBulan), sampai: endOfDay(akhirBulan) }
  }

  if (filterPeriode.value === 'custom') {
    return {
      dari: customDari.value ? startOfDay(customDari.value) : null,
      sampai: customSampai.value ? endOfDay(customSampai.value) : null
    }
  }

  return { dari: null, sampai: null }
})

// Reset ke halaman 1 setiap filter berubah
watch([filterPeriode, customDari, customSampai, filterJenisIkan, filterKolam, pencarian, perHalaman], () => {
  halamanSekarang.value = 1
})

watch(() => form.value.jenis_ikan_id, (id) => {
  if (!id) return
  const ikan = daftarJenisIkan.value.find(j => String(j.id) === String(id))
  if (ikan && ikan.harga_per_kg !== undefined && ikan.harga_per_kg !== null) {
    form.value.harga_per_kg = Number(ikan.harga_per_kg)
  }
})

async function muat() {
  loading.value = true
  const [pj, ji, km] = await Promise.all([
    fetch('/api/penjualan').then(r => r.json()),
    fetch('/api/jenis-ikan').then(r => r.json()),
    fetch('/api/kolam').then(r => r.json())
  ])
  daftar.value = pj.data
  daftarJenisIkan.value = ji.data
  daftarKolam.value = km.data
  loading.value = false
}

const totalPreview = computed(() => {
  const jumlah = Number(form.value.jumlah_kg) || 0
  const harga = Number(form.value.harga_per_kg) || 0
  return jumlah * harga
})

function bukaTambah() {
  editingId.value = null
  form.value = kosongForm()
  showForm.value = true
}

function edit(p) {
  editingId.value = p.id
  form.value = {
    tanggal: p.tanggal ? p.tanggal.slice(0, 10) : new Date().toISOString().slice(0, 10),
    jenis_ikan_id: p.jenis_ikan_id ?? '',
    kolam_id: p.kolam_id ?? '',
    jumlah_kg: p.jumlah_kg ?? '',
    harga_per_kg: p.harga_per_kg ?? '',
    nama_pembeli: p.nama_pembeli ?? '',
    no_hp: p.no_hp ?? '',
    catatan: p.catatan ?? ''
  }
  showForm.value = true
}

async function simpan() {
  menyimpan.value = true
  try {
    const isEdit = editingId.value !== null
    const url = isEdit ? `/api/penjualan/${editingId.value}` : '/api/penjualan'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.message || (isEdit ? 'Gagal mengupdate transaksi' : 'Gagal menyimpan transaksi'))
      return
    }

    showForm.value = false
    editingId.value = null
    form.value = kosongForm()
    await muat()
  } finally {
    menyimpan.value = false
  }
}

async function hapus(id) {
  if (!confirm('Hapus transaksi ini?')) return
  const res = await fetch(`/api/penjualan/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus transaksi')
    return
  }
  await muat()
}

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

// ====================== DATA TERFILTER ======================
const dataTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()
  const { dari, sampai } = rentangTanggal.value

  return [...daftar.value]
    .filter((p) => {
      if (kataKunci) {
        const gabungan = `${p.nama_ikan || ''} ${p.nama_kolam || ''} ${p.nama_pembeli || ''} ${p.no_hp || ''} ${p.catatan || ''}`.toLowerCase()
        if (!gabungan.includes(kataKunci)) return false
      }

      if (dari || sampai) {
        const tgl = new Date(p.tanggal)
        if (dari && tgl < dari) return false
        if (sampai && tgl > sampai) return false
      }

      if (filterJenisIkan.value && String(p.jenis_ikan_id) !== String(filterJenisIkan.value)) return false
      if (filterKolam.value && String(p.kolam_id) !== String(filterKolam.value)) return false

      return true
    })
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})

// ====================== PAGINATION ======================
const totalData = computed(() => dataTerfilter.value.length)
const totalHalaman = computed(() => Math.ceil(totalData.value / perHalaman.value) || 1)

const dataHalaman = computed(() => {
  const start = (halamanSekarang.value - 1) * perHalaman.value
  const end = start + perHalaman.value
  return dataTerfilter.value.slice(start, end)
})

const infoPagination = computed(() => {
  if (totalData.value === 0) return 'Tidak ada data'
  const start = (halamanSekarang.value - 1) * perHalaman.value + 1
  const end = Math.min(halamanSekarang.value * perHalaman.value, totalData.value)
  return `Menampilkan ${start}–${end} dari ${totalData.value} transaksi`
})

function keHalaman(halaman) {
  if (halaman < 1 || halaman > totalHalaman.value) return
  halamanSekarang.value = halaman
}

const nomorHalaman = computed(() => {
  const total = totalHalaman.value
  const current = halamanSekarang.value
  const pages = []

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  return pages
})

const totalPendapatan = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.total), 0)
)
const totalKg = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.jumlah_kg), 0)
)
const jumlahTransaksi = computed(() => dataTerfilter.value.length)

function resetFilter() {
  filterPeriode.value = 'semua'
  customDari.value = ''
  customSampai.value = ''
  filterJenisIkan.value = ''
  filterKolam.value = ''
  pencarian.value = ''
  halamanSekarang.value = 1
}

onMounted(muat)
</script>

<template>
  <div>
    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Pendapatan</p>
        <p class="text-xl font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(totalPendapatan) }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Terjual</p>
        <p class="text-xl font-semibold dark:text-white">{{ totalKg }} kg</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Jumlah Transaksi</p>
        <p class="text-xl font-semibold dark:text-white">{{ jumlahTransaksi }}</p>
      </div>
    </div>

    <!-- FILTER SECTION -->
    <div class="mb-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="opt in [
            { value: 'semua', label: 'Semua' },
            { value: 'hari-ini', label: 'Hari ini' },
            { value: 'minggu-ini', label: 'Minggu ini' },
            { value: 'bulan-ini', label: 'Bulan ini' },
            { value: 'custom', label: 'Custom' }
          ]"
          :key="opt.value"
          type="button"
          class="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border"
          :class="filterPeriode === opt.value
            ? 'bg-brand-500 text-white border-brand-500'
            : 'bg-white dark:bg-ink-700 text-ink-600 dark:text-ink-300 border-ink-100 dark:border-ink-500 hover:bg-ink-50 dark:hover:bg-ink-600'"
          @click="filterPeriode = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <div v-if="filterPeriode === 'custom'" class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-[13px] text-ink-500 dark:text-ink-300">Dari</label>
          <input v-model="customDari" type="date" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[13px] text-ink-500 dark:text-ink-300">Sampai</label>
          <input v-model="customSampai" type="date" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]" />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-[13px] text-ink-500 dark:text-ink-300">Jenis Ikan</label>
          <select v-model="filterJenisIkan" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px] min-w-[160px]">
            <option value="">Semua Jenis</option>
            <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-[13px] text-ink-500 dark:text-ink-300">Kolam</label>
          <select v-model="filterKolam" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px] min-w-[140px]">
            <option value="">Semua Kolam</option>
            <option v-for="k in daftarKolam" :key="k.id" :value="k.id">{{ k.nama_kolam }}</option>
          </select>
        </div>

        <button
          v-if="filterPeriode !== 'semua' || filterJenisIkan || filterKolam || pencarian"
          type="button"
          class="text-[13px] text-danger-600 dark:text-danger-500 font-medium hover:underline"
          @click="resetFilter"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Search & Tambah -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari jenis ikan, kolam, pembeli, atau catatan..."
          class="w-full pl-9 pr-3 py-2 text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg bg-white dark:bg-ink-900 dark:text-white placeholder:text-ink-400"
        />
      </div>
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 whitespace-nowrap"
        @click="bukaTambah"
      >
        + Tambah Penjualan
      </button>
    </div>

    <!-- Tabel -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Tanggal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Jenis Ikan</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Pembeli</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Jumlah (kg)</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Harga/kg</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Total</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Catatan</th>
              <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Memuat data...</td>
            </tr>
            <tr v-else-if="dataHalaman.length === 0">
              <td colspan="9" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
                {{ (pencarian || filterPeriode !== 'semua' || filterJenisIkan || filterKolam)
                  ? 'Tidak ada transaksi yang cocok dengan filter.'
                  : 'Belum ada transaksi penjualan.' }}
              </td>
            </tr>
            <tr v-for="p in dataHalaman" :key="p.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
              <td class="px-4 py-3 whitespace-nowrap">{{ tanggal(p.tanggal) }}</td>
              <td class="px-4 py-3">{{ p.nama_ikan }}</td>
              <td class="px-4 py-3">{{ p.nama_kolam || '-' }}</td>
              <td class="px-4 py-3">
                <div v-if="p.nama_pembeli">
                  <p class="font-medium">{{ p.nama_pembeli }}</p>
                  <p v-if="p.no_hp" class="text-[12px] text-ink-500 dark:text-ink-300">{{ p.no_hp }}</p>
                </div>
                <span v-else class="text-ink-400">-</span>
              </td>
              <td class="px-4 py-3">{{ p.jumlah_kg }}</td>
              <td class="px-4 py-3">{{ rupiah(p.harga_per_kg) }}</td>
              <td class="px-4 py-3 font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(p.total) }}</td>
              <td class="px-4 py-3 text-ink-500 dark:text-ink-300">{{ p.catatan || '-' }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <button type="button" class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" title="Edit" @click="edit(p)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button type="button" class="text-danger-600 dark:text-danger-500 text-[12.5px] font-semibold hover:underline" @click="hapus(p.id)">
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="!loading && totalData > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-ink-100 dark:border-ink-500">
        <div class="flex items-center gap-3 text-[13px] text-ink-500 dark:text-ink-300">
          <span>{{ infoPagination }}</span>
          <div class="flex items-center gap-1.5">
            <span>Tampilkan</span>
            <select v-model="perHalaman" class="rounded border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-2 py-1 text-[13px]">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
            <span>data</span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-[13px] border border-ink-100 dark:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-600"
            :disabled="halamanSekarang === 1"
            @click="keHalaman(halamanSekarang - 1)"
          >
            ←
          </button>

          <template v-for="(page, idx) in nomorHalaman" :key="idx">
            <span v-if="page === '...'" class="px-2 text-ink-400">...</span>
            <button
              v-else
              type="button"
              class="min-w-[32px] px-2 py-1.5 rounded-lg text-[13px] border transition-colors"
              :class="page === halamanSekarang
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-ink-100 dark:border-ink-500 hover:bg-ink-50 dark:hover:bg-ink-600'"
              @click="keHalaman(page)"
            >
              {{ page }}
            </button>
          </template>

          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-[13px] border border-ink-100 dark:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-600"
            :disabled="halamanSekarang === totalHalaman"
            @click="keHalaman(halamanSekarang + 1)"
          >
            →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Tambah / Edit -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">
          {{ editingId ? 'Edit Penjualan' : 'Tambah Penjualan' }}
        </h2>
        <form class="space-y-3" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis Ikan</label>
            <select v-model="form.jenis_ikan_id" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="" disabled>Pilih jenis ikan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">
                {{ ji.nama }} — {{ rupiah(ji.harga_per_kg) }}/kg
              </option>
            </select>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam (opsional)</label>
            <select v-model="form.kolam_id" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="">Tidak diketahui</option>
              <option v-for="k in daftarKolam" :key="k.id" :value="k.id">{{ k.nama_kolam }}</option>
            </select>
          </div>

          <!-- Informasi Pembeli -->
          <div class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Pembeli <span class="text-danger-500">*</span></label>
              <input
                v-model="form.nama_pembeli"
                type="text"
                required
                placeholder="Contoh: Pak Slamet / Ibu Siti"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">No. HP (opsional)</label>
              <input
                v-model="form.no_hp"
                type="text"
                placeholder="08xxxxxxxxxx"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah (kg)</label>
              <input v-model="form.jumlah_kg" type="number" step="0.1" min="0" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-[13px] font-medium dark:text-ink-300">Harga/kg</label>
                <span v-if="form.harga_per_kg" class="text-[11px] text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-900/40 px-1.5 py-0.5 rounded">Otomatis</span>
              </div>
              <input v-model="form.harga_per_kg" type="number" min="0" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
          </div>

          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-500">
            <span class="text-[13px] text-ink-500 dark:text-ink-300">Total</span>
            <span class="text-[15px] font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(totalPreview) }}</span>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea v-model="form.catatan" rows="2" placeholder="Contoh: dibayar cash / transfer" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
            <button type="submit" :disabled="menyimpan" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60">
              {{ menyimpan ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
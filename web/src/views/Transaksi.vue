<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const daftar = ref([])
const daftarJenisIkan = ref([])
const daftarKolam = ref([])
const loading = ref(true)
const showForm = ref(false)
const menyimpan = ref(false)
const editingId = ref(null)

// Modal hapus
const showHapusModal = ref(false)
const idYangAkanDihapus = ref(null)

// Modal sukses (muncul setelah tambah/edit transaksi berhasil)
const showSuksesModal = ref(false)
const pesanSukses = ref('')
function tutupSukses() {
  showSuksesModal.value = false
  pesanSukses.value = ''
}

const kosongForm = () => ({
  tanggal: new Date().toISOString().slice(0, 10),
  jenis_ikan_id: '',
  kolam_id: '',
  jumlah_kg: '',
  harga_per_kg: '',
  catatan: ''
})
const form = ref(kosongForm())

const halamanSekarang = ref(1)
const perHalaman = ref(10)

watch([perHalaman], () => {
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

    // Tampilkan modal sukses
    pesanSukses.value = isEdit
      ? 'Transaksi berhasil diperbarui.'
      : 'Transaksi berhasil ditambahkan.'
    showSuksesModal.value = true
  } finally {
    menyimpan.value = false
  }
}

function bukaHapus(id) {
  idYangAkanDihapus.value = id
  showHapusModal.value = true
}

function tutupHapus() {
  showHapusModal.value = false
  idYangAkanDihapus.value = null
}

async function konfirmasiHapus() {
  if (!idYangAkanDihapus.value) return
  const res = await fetch(`/api/penjualan/${idYangAkanDihapus.value}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus transaksi')
    return
  }
  tutupHapus()
  await muat()
}

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

const dataTerfilter = computed(() => {
  return [...daftar.value].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})

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

    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 whitespace-nowrap"
        @click="bukaTambah"
      >
        + Tambah Penjualan
      </button>
    </div>

    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Tanggal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Jenis Ikan</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Jumlah (kg)</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Harga/kg</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Total</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Catatan</th>
              <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Memuat data...</td>
            </tr>
            <tr v-else-if="dataHalaman.length === 0">
              <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
                Belum ada transaksi penjualan.
              </td>
            </tr>
            <tr v-for="p in dataHalaman" :key="p.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
              <td class="px-4 py-3 whitespace-nowrap">{{ tanggal(p.tanggal) }}</td>
              <td class="px-4 py-3">{{ p.nama_ikan || '(jenis ikan tidak ditemukan)' }}</td>
              <td class="px-4 py-3">{{ p.nama_kolam || '-' }}</td>
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
                  <button type="button" class="text-danger-600 dark:text-danger-500 text-[12.5px] font-semibold hover:underline" @click="bukaHapus(p.id)">
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
          <button type="button" class="px-2.5 py-1.5 rounded-lg text-[13px] border border-ink-100 dark:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-600" :disabled="halamanSekarang === 1" @click="keHalaman(halamanSekarang - 1)">←</button>

          <template v-for="(page, idx) in nomorHalaman" :key="idx">
            <span v-if="page === '...'" class="px-2 text-ink-400">...</span>
            <button v-else type="button" class="min-w-[32px] px-2 py-1.5 rounded-lg text-[13px] border transition-colors" :class="page === halamanSekarang ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-100 dark:border-ink-500 hover:bg-ink-50 dark:hover:bg-ink-600'" @click="keHalaman(page)">
              {{ page }}
            </button>
          </template>

          <button type="button" class="px-2.5 py-1.5 rounded-lg text-[13px] border border-ink-100 dark:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-600" :disabled="halamanSekarang === totalHalaman" @click="keHalaman(halamanSekarang + 1)">→</button>
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
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }} — {{ rupiah(ji.harga_per_kg) }}/kg</option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam (opsional)</label>
            <select v-model="form.kolam_id" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="">Tidak diketahui</option>
              <option v-for="k in daftarKolam" :key="k.id" :value="k.id">{{ k.nama_kolam }}</option>
            </select>
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

    <!-- Modal Konfirmasi Hapus -->
    <Teleport to="body">
      <div v-if="showHapusModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupHapus"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Hapus Transaksi?</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">Data transaksi ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
          </div>
          <div class="px-6 pb-6 pt-4 flex gap-3">
            <button type="button" @click="tutupHapus" class="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 text-[13.5px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition">Batal</button>
            <button type="button" @click="konfirmasiHapus" class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13.5px] font-medium transition">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Sukses (tambah/edit transaksi berhasil) -->
    <Teleport to="body">
      <div v-if="showSuksesModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupSukses"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-ok-50 dark:bg-ok-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ok-500">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Berhasil!</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">
              {{ pesanSukses }}
            </p>
          </div>
          <div class="px-6 pb-6 pt-4">
            <button type="button" @click="tutupSukses" class="w-full px-4 py-2.5 rounded-xl bg-ok-500 hover:bg-ok-600 text-white text-[13.5px] font-medium transition">
              Oke
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
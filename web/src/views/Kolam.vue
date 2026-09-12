<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
const daftarKolam = ref([])
const pencarian = ref('')
const filterJenis = ref('')
const filterStatus = ref('')
const daftarJenisIkan = ref([])
const halamanSekarang = ref(1)
const perHalaman = ref(10)
const showTebarForm = ref(false)
const showTambahKolam = ref(false)
const showEditKolam = ref(false)
const kolamDipilih = ref(null)
const kolamDiedit = ref(null)
// Menu aksi
const menuTerbuka = ref(null)
// Modal hapus
const showHapusKolamModal = ref(false)
const kolamYangAkanDihapus = ref(null)
// Modal sukses (muncul setelah tambah/edit kolam berhasil disimpan)
const showSuksesModal = ref(false)
const pesanSukses = ref('')
function tutupSukses() {
  showSuksesModal.value = false
  pesanSukses.value = ''
}
function toggleMenu(id) {
  menuTerbuka.value = menuTerbuka.value === id ? null : id
}
function tutupMenu() {
  menuTerbuka.value = null
}
function handleClickLuar(e) {
  if (!e.target.closest('.menu-aksi-kolam')) {
    tutupMenu()
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickLuar)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickLuar)
})
const form = ref({ jenis_ikan_id: '', tanggal_tebar: '', jumlah_bibit: '' })
const formKolam = ref({ nama_kolam: '', luas_m2: '', jenis_id: '' })
const formEditKolam = ref({ nama_kolam: '', luas_m2: '', jenis_id: '' })
async function muatKolam() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  daftarKolam.value = json.data
}
async function muatJenisIkan() {
  const res = await fetch('/api/jenis-ikan')
  const json = await res.json()
  daftarJenisIkan.value = json.data
}
function bukaTebar(kolam) {
  tutupMenu()
  kolamDipilih.value = kolam
  form.value = { jenis_ikan_id: '', tanggal_tebar: '', jumlah_bibit: '' }
  showTebarForm.value = true
}
function bukaTambahKolam() {
  formKolam.value = { nama_kolam: '', luas_m2: '', jenis_id: '' }
  showTambahKolam.value = true
}
function bukaEditKolam(kolam) {
  tutupMenu()
  kolamDiedit.value = kolam
  formEditKolam.value = {
    nama_kolam: kolam.nama_kolam,
    luas_m2: kolam.luas_m2 || '',
    jenis_id: kolam.jenis_id || ''
  }
  showEditKolam.value = true
}
function bukaHapusKolam(kolam) {
  tutupMenu()
  kolamYangAkanDihapus.value = kolam
  showHapusKolamModal.value = true
}
function tutupHapusKolam() {
  showHapusKolamModal.value = false
  kolamYangAkanDihapus.value = null
}
async function konfirmasiHapusKolam() {
  if (!kolamYangAkanDihapus.value) return
  const res = await fetch(`/api/kolam/${kolamYangAkanDihapus.value.id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus kolam')
    return
  }
  tutupHapusKolam()
  await muatKolam()
}
async function simpanTebar() {
  const res = await fetch('/api/tebar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kolam_id: kolamDipilih.value.id,
      ...form.value
    })
  })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan tebar')
    return
  }
  showTebarForm.value = false
  await muatKolam()
}
async function simpanKolam() {
  const payload = {
    nama_kolam: formKolam.value.nama_kolam,
    luas_m2: formKolam.value.luas_m2 ? Number(formKolam.value.luas_m2) : null,
    jenis_id: formKolam.value.jenis_id || null
  }
  const res = await fetch('/api/kolam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menambah kolam')
    return
  }
  showTambahKolam.value = false
  await muatKolam()
  // Tampilkan modal sukses
  pesanSukses.value = 'Kolam berhasil ditambahkan.'
  showSuksesModal.value = true
}
async function simpanEditKolam() {
  const payload = {
    nama_kolam: formEditKolam.value.nama_kolam,
    luas_m2: formEditKolam.value.luas_m2 ? Number(formEditKolam.value.luas_m2) : null,
    jenis_id: formEditKolam.value.jenis_id || null
  }
  const res = await fetch(`/api/kolam/${kolamDiedit.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal mengubah kolam')
    return
  }
  showEditKolam.value = false
  await muatKolam()
  // Tampilkan modal sukses
  pesanSukses.value = 'Kolam berhasil diperbarui.'
  showSuksesModal.value = true
}
function rupiah(n) {
  return n ? Number(n).toLocaleString('id-ID') : '-'
}
function tambahHari(tanggal, hari) {
  const d = new Date(tanggal)
  d.setDate(d.getDate() + Number(hari))
  return d
}
function estimasiSortir(k) {
  if (!k.tanggal_tebar || !k.hari_sortir) return null
  return tambahHari(k.tanggal_tebar, k.hari_sortir)
}
function estimasiPanen(k) {
  if (!k.tanggal_tebar || !k.hari_panen) return null
  return tambahHari(k.tanggal_tebar, k.hari_panen)
}
function formatTanggalEstimasi(d) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
function sudahLewat(d) {
  const hariIni = new Date()
  hariIni.setHours(0, 0, 0, 0)
  return d < hariIni
}
const kolamTerfilter = computed(() => {
  const kata = pencarian.value.trim().toLowerCase()
  return daftarKolam.value.filter((k) => {
    const namaJenis = (k.nama_jenis || k.nama_ikan || '').toLowerCase()
    const cocokKata =
      !kata ||
      k.nama_kolam.toLowerCase().includes(kata) ||
      namaJenis.includes(kata)
    const cocokJenis =
      !filterJenis.value ||
      String(k.jenis_id) === String(filterJenis.value) ||
      namaJenis === filterJenis.value.toLowerCase()
    const cocokStatus = !filterStatus.value || k.status === filterStatus.value
    return cocokKata && cocokJenis && cocokStatus
  })
})
function resetFilter() {
  pencarian.value = ''
  filterJenis.value = ''
  filterStatus.value = ''
}
watch([pencarian, filterJenis, filterStatus, perHalaman], () => {
  halamanSekarang.value = 1
})
const totalData = computed(() => kolamTerfilter.value.length)
const totalHalaman = computed(() => Math.ceil(totalData.value / perHalaman.value) || 1)
const kolamHalaman = computed(() => {
  const start = (halamanSekarang.value - 1) * perHalaman.value
  const end = start + perHalaman.value
  return kolamTerfilter.value.slice(start, end)
})
const infoPagination = computed(() => {
  if (totalData.value === 0) return 'Tidak ada data'
  const start = (halamanSekarang.value - 1) * perHalaman.value + 1
  const end = Math.min(halamanSekarang.value * perHalaman.value, totalData.value)
  return `Menampilkan ${start}–${end} dari ${totalData.value} kolam`
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
  } else if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }
  return pages
})
onMounted(() => {
  muatKolam()
  muatJenisIkan()
})
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="bukaTambahKolam"
      >
        + Tambah Kolam
      </button>
    </div>
    <!-- Search & Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="relative flex-1 min-w-0">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 4.65a7.5 7.5 0 0011.9 11.9z" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari nama kolam atau jenis..."
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white pl-9 pr-3 py-2.5 text-[13.5px]"
        />
      </div>
      <select v-model="filterJenis" class="w-full sm:w-56 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]">
        <option value="">Semua jenis</option>
        <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
      </select>
      <select v-model="filterStatus" class="w-full sm:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]">
        <option value="">Semua status</option>
        <option value="aktif">Aktif</option>
        <option value="kosong">Kosong</option>
      </select>
      <button
        v-if="pencarian || filterJenis || filterStatus"
        type="button"
        class="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 text-[13px] font-medium hover:bg-ink-50 dark:hover:bg-ink-600 shrink-0"
        @click="resetFilter"
      >
        Reset
      </button>
    </div>
    <!-- Tabel -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Luas (m²)</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Tebar</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Perkiraan Sortir/Panen</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Bibit</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in kolamHalaman" :key="k.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
            <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
            <td class="px-4 py-3">{{ k.luas_m2 ? Number(k.luas_m2).toLocaleString('id-ID') : '-' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-[11.5px] font-semibold" :class="k.status === 'aktif' ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400' : 'bg-ink-100 text-ink-500 dark:bg-ink-500/40 dark:text-ink-200'">
                {{ k.status === 'aktif' ? 'Aktif' : 'Kosong' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ k.nama_jenis || k.nama_ikan || '-' }}</td>
            <td class="px-4 py-3">{{ k.tanggal_tebar ? new Date(k.tanggal_tebar).toLocaleDateString('id-ID') : '-' }}</td>
            <td class="px-4 py-3 text-[12.5px] min-w-[150px]">
              <template v-if="estimasiSortir(k) || estimasiPanen(k)">
                <p v-if="estimasiSortir(k)" :class="sudahLewat(estimasiSortir(k)) ? 'text-danger-600 dark:text-danger-500 font-semibold' : 'dark:text-ink-100'">
                  Sortir: {{ formatTanggalEstimasi(estimasiSortir(k)) }}
                  <span v-if="sudahLewat(estimasiSortir(k))">(lewat)</span>
                </p>
                <p v-if="estimasiPanen(k)" :class="sudahLewat(estimasiPanen(k)) ? 'text-danger-600 dark:text-danger-500 font-semibold' : 'dark:text-ink-100'">
                  Panen: {{ formatTanggalEstimasi(estimasiPanen(k)) }}
                  <span v-if="sudahLewat(estimasiPanen(k))">(lewat)</span>
                </p>
              </template>
              <span v-else class="text-ink-400">-</span>
            </td>
            <td class="px-4 py-3">{{ rupiah(k.jumlah_bibit) }}</td>
            <td class="px-4 py-3">{{ rupiah(k.jumlah_saat_ini) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button v-if="k.status !== 'aktif'" type="button" class="px-3 py-1.5 rounded-lg bg-ink-700 dark:bg-ink-500 text-white text-[12.5px] font-semibold hover:bg-ink-800 dark:hover:bg-ink-400" @click="bukaTebar(k)">
                  Tebar Bibit
                </button>
                <div class="relative menu-aksi-kolam">
                  <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-600" @click.stop="toggleMenu(k.id)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                  <div v-if="menuTerbuka === k.id" class="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-lg shadow-card z-20 overflow-hidden">
                    <button type="button" class="w-full text-left px-3 py-2 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10" @click="bukaEditKolam(k)">
                      Edit
                    </button>
                    <button type="button" class="w-full text-left px-3 py-2 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" @click="bukaHapusKolam(k)">
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="daftarKolam.length === 0">
            <td colspan="9" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Belum ada kolam. Tambahkan kolam pertamamu untuk mulai mencatat.</td>
          </tr>
          <tr v-else-if="kolamTerfilter.length === 0">
            <td colspan="9" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Tidak ada kolam yang cocok dengan pencarian/filter kamu.</td>
          </tr>
        </tbody>
      </table>
      <!-- PAGINATION -->
      <div v-if="totalData > 0" class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-ink-100 dark:border-ink-500">
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
            <button v-else type="button" class="min-w-[32px] px-2 py-1.5 rounded-lg text-[13px] border transition-colors" :class="page === halamanSekarang ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-100 dark:border-ink-500 hover:bg-ink-50 dark:hover:bg-ink-600'" @click="keHalaman(page)">{{ page }}</button>
          </template>
          <button type="button" class="px-2.5 py-1.5 rounded-lg text-[13px] border border-ink-100 dark:border-ink-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-50 dark:hover:bg-ink-600" :disabled="halamanSekarang === totalHalaman" @click="keHalaman(halamanSekarang + 1)">→</button>
        </div>
      </div>
    </div>
    <!-- Modal Tebar Bibit -->
    <div v-if="showTebarForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showTebarForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tebar Bibit — {{ kolamDipilih?.nama_kolam }}</h2>
        <form class="space-y-3" @submit.prevent="simpanTebar">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis</label>
            <select v-model="form.jenis_ikan_id" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="" disabled>Pilih jenis</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }} (sortir {{ ji.hari_sortir }} hari, panen {{ ji.hari_panen }} hari)</option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal Tebar</label>
            <input v-model="form.tanggal_tebar" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah Bibit</label>
            <input v-model="form.jumlah_bibit" type="number" min="1" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showTebarForm = false">Batal</button>
            <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal Tambah Kolam -->
    <div v-if="showTambahKolam" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showTambahKolam = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Kolam Baru</h2>
        <form class="space-y-3" @submit.prevent="simpanKolam">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Kolam</label>
            <input v-model="formKolam.nama_kolam" type="text" required placeholder="Contoh: Kolam A1" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis <span class="text-ink-400 font-normal">(opsional)</span></label>
            <select v-model="formKolam.jenis_id" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="">Belum ditentukan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Luas (m²) <span class="text-ink-400 font-normal">(opsional)</span></label>
            <input v-model="formKolam.luas_m2" type="number" min="0" step="0.01" placeholder="Contoh: 50" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showTambahKolam = false">Batal</button>
            <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal Edit Kolam -->
    <div v-if="showEditKolam" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showEditKolam = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Edit Kolam</h2>
        <form class="space-y-3" @submit.prevent="simpanEditKolam">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Kolam</label>
            <input v-model="formEditKolam.nama_kolam" type="text" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis <span class="text-ink-400 font-normal">(opsional)</span></label>
            <select v-model="formEditKolam.jenis_id" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="">Belum ditentukan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Luas (m²) <span class="text-ink-400 font-normal">(opsional)</span></label>
            <input v-model="formEditKolam.luas_m2" type="number" min="0" step="0.01" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showEditKolam = false">Batal</button>
            <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Modal Konfirmasi Hapus Kolam -->
    <Teleport to="body">
      <div v-if="showHapusKolamModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupHapusKolam"></div>
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
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Hapus Kolam?</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">
              Kolam <strong>"{{ kolamYangAkanDihapus?.nama_kolam }}"</strong> akan dihapus permanen. Data ini tidak bisa dikembalikan.
            </p>
          </div>
          <div class="px-6 pb-6 pt-4 flex gap-3">
            <button type="button" @click="tutupHapusKolam" class="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 text-[13.5px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition">Batal</button>
            <button type="button" @click="konfirmasiHapusKolam" class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13.5px] font-medium transition">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Sukses (tambah/edit kolam berhasil disimpan) -->
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
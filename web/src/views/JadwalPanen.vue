<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const activeTab = ref('jadwal') // 'jadwal' | 'riwayat'

const daftar = ref([])
const riwayat = ref([])
const loadingRiwayat = ref(false)

// filter riwayat
const filterKolam = ref('')
const filterBulan = ref('')
const filterTahun = ref('')

const namaBulan = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const opsiKolam = computed(() => {
  const set = new Set(riwayat.value.map(r => r.nama_kolam))
  return [...set].sort()
})

const opsiTahun = computed(() => {
  const set = new Set(riwayat.value.map(r => new Date(r.tanggal).getFullYear()))
  return [...set].sort((a, b) => b - a)
})

const riwayatFiltered = computed(() => {
  return riwayat.value.filter(r => {
    const d = new Date(r.tanggal)
    if (filterKolam.value && r.nama_kolam !== filterKolam.value) return false
    if (filterBulan.value && (d.getMonth() + 1) !== Number(filterBulan.value)) return false
    if (filterTahun.value && d.getFullYear() !== Number(filterTahun.value)) return false
    return true
  })
})

function resetFilter() {
  filterKolam.value = ''
  filterBulan.value = ''
  filterTahun.value = ''
}

// ringkasan statistik
const statJadwal = computed(() => {
  const total = daftar.value.length
  const selesai = daftar.value.filter(j => j.status === 'selesai').length
  const terlambat = daftar.value.filter(j => isTerlambat(j)).length
  return { total, menunggu: total - selesai, selesai, terlambat }
})

const statRiwayat = computed(() => {
  const list = riwayatFiltered.value
  const totalEkor = list.reduce((s, r) => s + (Number(r.jumlah_ekor) || 0), 0)
  const totalBerat = list.reduce((s, r) => s + (Number(r.berat_kg) || 0), 0)
  return { total: list.length, totalEkor, totalBerat }
})

const showForm = ref(false)
const jadwalDipilih = ref(null)
const form = ref({ tanggal: new Date().toISOString().slice(0, 10), jumlah_ekor: '', berat_kg: '', catatan: '' })

async function muat() {
  const res = await fetch('/api/jadwal?jenis=panen')
  const json = await res.json()
  daftar.value = json.data
}

async function muatRiwayat() {
  loadingRiwayat.value = true
  try {
    const res = await fetch('/api/panen')
    const json = await res.json()
    riwayat.value = json.data
  } finally {
    loadingRiwayat.value = false
  }
}

// muat riwayat baru saat pertama kali tab dibuka
watch(activeTab, (tab) => {
  if (tab === 'riwayat' && riwayat.value.length === 0) muatRiwayat()
})

function bukaForm(j) {
  jadwalDipilih.value = j
  form.value = { tanggal: new Date().toISOString().slice(0, 10), jumlah_ekor: j.jumlah_saat_ini, berat_kg: '', catatan: '' }
  showForm.value = true
}

async function simpan() {
  await fetch('/api/panen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jadwal_id: jadwalDipilih.value.id,
      tebar_id: jadwalDipilih.value.tebar_id,
      kolam_id: jadwalDipilih.value.kolam_id,
      ...form.value
    })
  })
  showForm.value = false
  await muat()
  // refresh riwayat juga kalau sudah pernah dimuat, biar data baru langsung tampil
  if (riwayat.value.length > 0 || activeTab.value === 'riwayat') await muatRiwayat()
}

function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

function isTerlambat(j) {
  if (j.status === 'selesai') return false
  const hariIni = new Date()
  hariIni.setHours(0, 0, 0, 0)
  return new Date(j.tanggal_jadwal) < hariIni
}

onMounted(muat)
</script>

<template>
  <!-- Tab switcher -->
  <div class="flex items-center gap-1 mb-4 bg-ink-50 dark:bg-ink-900/40 rounded-lg p-1 w-fit">
    <button
      type="button"
      class="px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors"
      :class="activeTab === 'jadwal'
        ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-400 shadow-sm'
        : 'text-ink-500 dark:text-ink-300'"
      @click="activeTab = 'jadwal'"
    >
      Jadwal
    </button>
    <button
      type="button"
      class="px-4 py-2 rounded-md text-[13.5px] font-semibold transition-colors"
      :class="activeTab === 'riwayat'
        ? 'bg-white dark:bg-ink-700 text-brand-600 dark:text-brand-400 shadow-sm'
        : 'text-ink-500 dark:text-ink-300'"
      @click="activeTab = 'riwayat'"
    >
      Riwayat Panen
    </button>
  </div>

  <!-- Ringkasan statistik -->
  <div v-if="activeTab === 'jadwal'" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Total Jadwal</p>
      <p class="text-[22px] font-bold dark:text-white mt-1">{{ statJadwal.total }}</p>
    </div>
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Menunggu Panen</p>
      <p class="text-[22px] font-bold text-warn-600 dark:text-warn-500 mt-1">{{ statJadwal.menunggu }}</p>
    </div>
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Selesai</p>
      <p class="text-[22px] font-bold text-ok-600 dark:text-ok-500 mt-1">{{ statJadwal.selesai }}</p>
    </div>
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Terlambat</p>
      <p class="text-[22px] font-bold text-danger-600 dark:text-danger-500 mt-1">{{ statJadwal.terlambat }}</p>
    </div>
  </div>
  <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Total Panen Tercatat</p>
      <p class="text-[22px] font-bold dark:text-white mt-1">{{ statRiwayat.total }}</p>
    </div>
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Total Ekor Terpanen</p>
      <p class="text-[22px] font-bold dark:text-white mt-1">{{ statRiwayat.totalEkor.toLocaleString('id-ID') }}</p>
    </div>
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 p-4">
      <p class="text-[12.5px] text-ink-500 dark:text-ink-300 font-medium">Total Berat (kg)</p>
      <p class="text-[22px] font-bold dark:text-white mt-1">{{ statRiwayat.totalBerat.toLocaleString('id-ID') }}</p>
    </div>
  </div>

  <!-- Tab: Jadwal -->
  <div v-if="activeTab === 'jadwal'" class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Jadwal</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
          <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="j in daftar" :key="j.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100" :class="{ 'bg-danger-50/40 dark:bg-danger-600/10': isTerlambat(j) }">
          <td class="px-4 py-3 font-semibold">{{ j.nama_kolam }}</td>
          <td class="px-4 py-3">{{ j.nama_ikan }}</td>
          <td class="px-4 py-3">{{ j.jumlah_saat_ini }}</td>
          <td class="px-4 py-3" :class="isTerlambat(j) ? 'text-danger-600 dark:text-danger-500 font-semibold' : ''">{{ tanggal(j.tanggal_jadwal) }}</td>
          <td class="px-4 py-3">
            <span
              v-if="isTerlambat(j)"
              class="px-2 py-1 rounded-full text-[11.5px] font-semibold bg-danger-100 text-danger-600 dark:bg-danger-600/25 dark:text-danger-500"
            >
              Terlambat
            </span>
            <span
              v-else
              class="px-2 py-1 rounded-full text-[11.5px] font-semibold"
              :class="j.status === 'selesai'
                ? 'bg-ok-100 text-ok-600 dark:bg-ok-600/25 dark:text-ok-500'
                : 'bg-warn-100 text-warn-600 dark:bg-warn-600/25 dark:text-warn-500'"
            >
              {{ j.status === 'selesai' ? 'Selesai' : 'Belum' }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button v-if="j.status !== 'selesai'" type="button" class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600" @click="bukaForm(j)">
              Catat Panen
            </button>
          </td>
        </tr>
        <tr v-if="daftar.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada jadwal panen.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Tab: Riwayat -->
  <div v-else>
    <!-- Filter -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <select v-model="filterKolam" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-700 dark:text-white px-3 py-2 text-[13px]">
        <option value="">Semua Kolam</option>
        <option v-for="k in opsiKolam" :key="k" :value="k">{{ k }}</option>
      </select>

      <select v-model="filterBulan" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-700 dark:text-white px-3 py-2 text-[13px]">
        <option value="">Semua Bulan</option>
        <option v-for="(b, idx) in namaBulan" :key="idx" :value="idx + 1">{{ b }}</option>
      </select>

      <select v-model="filterTahun" class="rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-700 dark:text-white px-3 py-2 text-[13px]">
        <option value="">Semua Tahun</option>
        <option v-for="t in opsiTahun" :key="t" :value="t">{{ t }}</option>
      </select>

      <button
        v-if="filterKolam || filterBulan || filterTahun"
        type="button"
        class="text-[13px] font-semibold text-brand-500 hover:text-brand-600"
        @click="resetFilter"
      >
        Reset Filter
      </button>
    </div>

    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Panen</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Ekor</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Berat (kg)</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loadingRiwayat">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Memuat riwayat...
          </td>
        </tr>
        <tr v-for="r in riwayatFiltered" :key="r.id" v-else class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
          <td class="px-4 py-3">{{ tanggal(r.tanggal) }}</td>
          <td class="px-4 py-3 font-semibold">{{ r.nama_kolam }}</td>
          <td class="px-4 py-3">{{ r.jenis_ikan }}</td>
          <td class="px-4 py-3">{{ r.jumlah_ekor }}</td>
          <td class="px-4 py-3">{{ r.berat_kg ?? '-' }}</td>
          <td class="px-4 py-3 text-ink-500 dark:text-ink-300">{{ r.catatan || '-' }}</td>
        </tr>
        <tr v-if="!loadingRiwayat && riwayat.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada riwayat panen.
          </td>
        </tr>
        <tr v-else-if="!loadingRiwayat && riwayatFiltered.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Tidak ada riwayat yang cocok dengan filter.
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>

  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-4">Catat Panen — {{ jadwalDipilih?.nama_kolam }}</h2>
      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
          <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah Ekor</label>
          <input v-model="form.jumlah_ekor" type="number" min="1" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Berat (kg)</label>
          <input v-model="form.berat_kg" type="number" step="0.1" min="0" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
          <textarea v-model="form.catatan" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>
</template>
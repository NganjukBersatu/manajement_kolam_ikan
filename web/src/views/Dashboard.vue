<script setup>
import { ref, onMounted, computed } from 'vue'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const loading = ref(true)
const data = ref(null)
const jadwalGabungan = ref([])
const pakanSesi = ref([])
const perluPerhatian = ref([])

// [BARU] gaya kartu bersama, tab grafik, dan pesan galat
const card = 'bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4 sm:p-5'
const grafikAktif = ref('penjualan')
const galat = ref('')

const tampilkanSemuaPerhatian = ref(false)
const BATAS_TAMPIL_PERHATIAN = 5

const perluPerhatianTampil = computed(() => {
  if (tampilkanSemuaPerhatian.value) return perluPerhatian.value
  return perluPerhatian.value.slice(0, BATAS_TAMPIL_PERHATIAN)
})

function toggleTampilanPerhatian() {
  tampilkanSemuaPerhatian.value = !tampilkanSemuaPerhatian.value
}

function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}
function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

function selisihHari(d) {
  if (!d) return null
  const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0)
  const target = new Date(d); target.setHours(0, 0, 0, 0)
  return Math.round((target - hariIni) / 86400000)
}
function labelUrgensi(d) {
  const selisih = selisihHari(d)
  if (selisih === null) return null
  if (selisih < 0) return `Terlambat ${Math.abs(selisih)} hari`
  if (selisih === 0) return 'Hari ini'
  if (selisih === 1) return 'Besok'
  return `${selisih} hari lagi`
}
function chipUrgensi(d) {
  const selisih = selisihHari(d)
  if (selisih === null) return 'bg-ink-100 text-ink-500 border border-ink-200'
  if (selisih < 0) return 'bg-danger-100 text-danger-600 border border-danger-200'
  if (selisih <= 3) return 'bg-warn-100 text-warn-600 border border-warn-200'
  return 'bg-ok-100 text-ok-600 border border-ok-200'
}

function umurHari(tanggalTebar) {
  const selisih = selisihHari(tanggalTebar)
  if (selisih === null) return null
  return Math.abs(selisih)
}

const LABEL_KATEGORI = {
  pakan: 'Pakan',
  obat: 'Obat & vitamin',
  listrik: 'Listrik',
  gaji: 'Gaji',
  perlengkapan: 'Perlengkapan',
  lainnya: 'Lainnya'
}
const WARNA_KATEGORI = {
  pakan: 'bg-gold-500',
  obat: 'bg-brand-500',
  listrik: 'bg-warn-500',
  gaji: 'bg-danger-500',
  perlengkapan: 'bg-ok-500',
  lainnya: 'bg-ink-400'
}
const HEX_KATEGORI = {
  pakan: '#D4A017',
  obat: '#6366F1',
  listrik: '#F59E0B',
  gaji: '#EF4444',
  perlengkapan: '#22C55E',
  lainnya: '#94A3B8'
}

const pengeluaranBreakdown = computed(() => data.value?.pengeluaranBreakdown || [])
const totalPengeluaranBreakdown = computed(() =>
  pengeluaranBreakdown.value.reduce((sum, r) => sum + r.total, 0)
)

const ikanPerKolam = computed(() => data.value?.ikanPerKolam || [])
const ikanPerKolamUrut = computed(() =>
  [...ikanPerKolam.value].sort((a, b) => a.survivalRate - b.survivalRate)
)

const totalIkanPerKolam = computed(() => {
  const list = ikanPerKolam.value
  const totalBibit = list.reduce((sum, k) => sum + (k.jumlahBibit || 0), 0)
  const totalSekarang = list.reduce((sum, k) => sum + (k.jumlahSaatIni || 0), 0)
  const rataSurvival = totalBibit === 0 ? 0 : Math.round((totalSekarang / totalBibit) * 100)
  return { totalBibit, totalSekarang, rataSurvival }
})

function tanggalTebar(k) {
  return k.tanggalTebar ? tanggal(k.tanggalTebar) : '-'
}
function umurKolamLabel(k) {
  if (!k.tanggalTebar) return ''
  const hari = umurHari(k.tanggalTebar)
  return hari === null ? '' : `${hari} hari`
}

const chartPengeluaranDonut = computed(() => ({
  labels: pengeluaranBreakdown.value.map(r => r.label),
  datasets: [{
    data: pengeluaranBreakdown.value.map(r => r.total),
    backgroundColor: pengeluaranBreakdown.value.map(r => HEX_KATEGORI[r.kategori] || '#94A3B8'),
    borderWidth: 0,
    hoverOffset: 6
  }]
}))
const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}: ${rupiah(ctx.raw)}`
      }
    }
  }
}

function labelPerbandingan(persen) {
  if (persen === null || persen === undefined) return null
  const arah = persen > 0 ? '↑' : persen < 0 ? '↓' : '→'
  return `${arah} ${Math.abs(persen)}%`
}
function chipPerbandingan(persen, baik = true) {
  if (persen === null || persen === undefined || persen === 0) return 'bg-ink-100 text-ink-500 border border-ink-200'
  const naik = persen > 0
  if (!baik) return 'bg-ink-100 text-ink-500 border border-ink-200'
  return naik ? 'bg-ok-100 text-ok-600 border border-ok-200' : 'bg-danger-100 text-danger-600 border border-danger-200'
}

function warnaSurvival(rate) {
  if (rate < 70) return 'text-danger-600 dark:text-danger-500'
  if (rate < 85) return 'text-warn-600 dark:text-warn-500'
  return 'text-ok-600 dark:text-ok-500'
}
function barSurvival(rate) {
  if (rate < 70) return 'bg-danger-500'
  if (rate < 85) return 'bg-warn-500'
  return 'bg-ok-500'
}

const statusStyle = {
  sudah: { dot: 'bg-ok-500', chip: 'bg-ok-100 text-ok-600 border-ok-200', text: 'Selesai' },
  belum: { dot: 'bg-warn-500', chip: 'bg-warn-100 text-warn-600 border-warn-200', text: 'belum' },
  terlambat: { dot: 'bg-danger-500', chip: 'bg-danger-100 text-danger-600 border-danger-200', text: 'terlambat' }
}

const persenKolamAktif = computed(() => {
  if (!data.value) return 0
  const total = data.value.statistik.totalKolam || 0
  const aktif = data.value.statistik.kolamAktif || 0
  return total === 0 ? 0 : Math.round((aktif / total) * 100)
})

const totalPerluPerhatian = computed(() => perluPerhatian.value.length)
const totalTerlambat = computed(
  () => perluPerhatian.value.filter((k) => k.status === 'terlambat').length
)

const chartPenjualan = ref({
  labels: [],
  datasets: [{
    label: 'Penjualan',
    data: [],
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    fill: true,
    tension: 0.35,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2.5
  }]
})

const dataKeuntunganBulanan = ref({ labels: [], values: [] })

const chartKeuntungan = computed(() => {
  const values = dataKeuntunganBulanan.value.values
  const nilaiTerakhir = values.length ? values[values.length - 1] : 0
  const untung = nilaiTerakhir >= 0
  return {
    labels: dataKeuntunganBulanan.value.labels,
    datasets: [{
      label: 'Keuntungan',
      data: values,
      borderColor: untung ? '#22C55E' : '#EF4444',
      backgroundColor: untung ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5
    }]
  }
})

// [BARU] data grafik sesuai tab yang dipilih
const grafikData = computed(() =>
  grafikAktif.value === 'penjualan' ? chartPenjualan.value : chartKeuntungan.value
)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => rupiah(ctx.raw)
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        callback: (v) => {
          const abs = Math.abs(v)
          const tanda = v < 0 ? '-' : ''
          if (abs >= 1000000) return tanda + (abs / 1000000) + 'jt'
          if (abs >= 1000) return tanda + (abs / 1000) + 'rb'
          return v
        }
      }
    }
  }
}

// [DIUBAH] nama fungsi lama `muat` menjadi `muatData`, isinya tidak berubah
async function muatData() {
  loading.value = true

  const resDashboard = await fetch('/api/dashboard')
  data.value = await resDashboard.json()

  const [resSortir, resPanen, resPakan, resGrafik] = await Promise.all([
    fetch('/api/jadwal?jenis=sortir'),
    fetch('/api/jadwal?jenis=panen'),
    fetch('/api/pakan/ringkasan-hari-ini'),
    fetch('/api/dashboard/grafik-bulanan')
  ])

  const jsonSortir = await resSortir.json()
  const jsonPanen = await resPanen.json()
  const jsonPakan = await resPakan.json().catch(() => ({ data: [] }))
  const jsonGrafik = await resGrafik.json().catch(() => ({ labels: [], penjualan: [], keuntungan: [] }))

  const sortir = jsonSortir.data || []
  const panen = jsonPanen.data || []
  const pakan = jsonPakan.data || []

  chartPenjualan.value = {
    labels: jsonGrafik.labels || [],
    datasets: [{ ...chartPenjualan.value.datasets[0], data: jsonGrafik.penjualan || [] }]
  }
  dataKeuntunganBulanan.value = {
    labels: jsonGrafik.labels || [],
    values: jsonGrafik.keuntungan || []
  }

  const map = {}
  sortir.forEach(item => {
    if (item.status === 'selesai') return
    const key = item.kolam_id
    if (!map[key]) {
      map[key] = {
        kolam_id: item.kolam_id,
        nama_kolam: item.nama_kolam,
        nama_ikan: item.nama_ikan,
        jumlah: item.jumlah_saat_ini,
        tanggal_sortir: item.tanggal_jadwal,
        tanggal_panen: null,
        status_sortir: item.status
      }
    } else {
      map[key].tanggal_sortir = item.tanggal_jadwal
      map[key].jumlah = item.jumlah_saat_ini
      map[key].status_sortir = item.status
    }
  })

  panen.forEach(item => {
    if (item.status === 'selesai') return
    const key = item.kolam_id
    if (!map[key]) {
      map[key] = {
        kolam_id: item.kolam_id,
        nama_kolam: item.nama_kolam,
        nama_ikan: item.nama_ikan,
        jumlah: item.jumlah_saat_ini,
        tanggal_sortir: null,
        tanggal_panen: item.tanggal_jadwal,
        status_panen: item.status
      }
    } else {
      map[key].tanggal_panen = item.tanggal_jadwal
      map[key].status_panen = item.status
      if (!map[key].jumlah) map[key].jumlah = item.jumlah_saat_ini
    }
  })

  jadwalGabungan.value = Object.values(map).sort((a, b) => {
    const tglA = a.tanggal_sortir || a.tanggal_panen
    const tglB = b.tanggal_sortir || b.tanggal_panen
    return new Date(tglA) - new Date(tglB)
  })

  const urutanSesi = [
    { key: 'pagi', label: 'Pagi' },
    { key: 'siang', label: 'Siang' },
    { key: 'sore', label: 'Sore' }
  ]
  pakanSesi.value = urutanSesi.map(({ key, label }) => {
    const items = pakan.filter(p => p.sesi === key)
    return {
      nama: label,
      sudah: items.filter(p => p.status === 'sudah').length,
      belum: items.filter(p => p.status === 'belum').length,
      terlambat: items.filter(p => p.status === 'terlambat').length
    }
  })

  const daftarPerhatian = []
  const labelSesi = { pagi: 'Pagi', siang: 'Siang', sore: 'Sore' }
  pakan
    .filter(p => p.status !== 'sudah')
    .forEach(p => {
      daftarPerhatian.push({
        id: p.kolam_id,
        nama: p.nama_kolam,
        alasan: `Pakan sesi ${labelSesi[p.sesi] || p.sesi} ${p.status === 'terlambat' ? 'terlambat' : 'belum diberikan'}`,
        status: p.status
      })
    })

  const hariIni = new Date().toISOString().slice(0, 10)
  jadwalGabungan.value.forEach(j => {
    if (j.tanggal_sortir && j.tanggal_sortir <= hariIni && j.status_sortir !== 'selesai') {
      daftarPerhatian.push({
        id: j.kolam_id,
        nama: j.nama_kolam,
        alasan: j.tanggal_sortir < hariIni ? 'Sortir terlambat' : 'Sortir dijadwalkan hari ini',
        status: j.tanggal_sortir < hariIni ? 'terlambat' : 'belum'
      })
    }
  })

  const prioritas = { terlambat: 0, belum: 1, sudah: 2 }
  perluPerhatian.value = daftarPerhatian.sort((a, b) => prioritas[a.status] - prioritas[b.status])
  tampilkanSemuaPerhatian.value = false
  loading.value = false
}

// [BARU] pembungkus supaya kalau ada request gagal, halaman tidak blank
async function muat() {
  loading.value = true
  galat.value = ''
  try {
    await muatData()
  } catch (err) {
    console.error('Gagal memuat dashboard:', err)
    galat.value = 'Data dashboard gagal dimuat.'
  } finally {
    loading.value = false
  }
}

onMounted(muat)
</script>

<template>
  <div v-if="loading" class="text-[13.5px] text-ink-500 py-10 text-center">Memuat...</div>

  <div v-else-if="!data || !data.statistik" class="text-center py-10">
    <p class="text-[13.5px] text-ink-500 dark:text-ink-300">{{ galat || 'Data dashboard belum tersedia.' }}</p>
    <button type="button" class="mt-3 rounded-lg bg-brand-500 text-white px-4 py-2 text-[13.5px] font-semibold hover:bg-brand-600" @click="muat">
      Coba lagi
    </button>
  </div>

  <div v-else class="space-y-4 sm:space-y-5">
    <!-- ===================== HARI INI ===================== -->
    <section :class="card">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 class="text-[15px] font-semibold dark:text-white">Hari ini</h2>
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300">
            {{ new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
        </div>
        <span
          v-if="totalPerluPerhatian > 0"
          class="text-[12px] font-semibold px-3 py-1 rounded-full"
          :class="totalTerlambat > 0 ? 'bg-danger-100 text-danger-600' : 'bg-warn-100 text-warn-600'"
        >
          {{ totalPerluPerhatian }} perlu perhatian
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-4">
        <!-- Ringkasan sesi pakan -->
        <div class="grid grid-cols-3 gap-2 sm:gap-3 self-start">
          <div
            v-for="sesi in pakanSesi"
            :key="sesi.nama"
            class="rounded-lg border p-2.5 sm:p-3"
            :class="sesi.terlambat > 0
              ? statusStyle.terlambat.chip
              : sesi.belum > 0
                ? statusStyle.belum.chip
                : statusStyle.sudah.chip"
          >
            <p class="text-[11px] sm:text-[12px] opacity-80">Pakan {{ sesi.nama.toLowerCase() }}</p>
            <p class="text-[13px] font-semibold mt-0.5">
              <template v-if="sesi.terlambat > 0">{{ sesi.terlambat }} terlambat</template>
              <template v-else-if="sesi.belum > 0">{{ sesi.belum }} belum</template>
              <template v-else>Selesai</template>
            </p>
          </div>
        </div>

        <!-- Daftar perlu perhatian -->
        <div class="min-w-0">
          <p v-if="totalPerluPerhatian === 0" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-1">
            Semua kolam sudah ditangani hari ini. Tidak ada yang tertunda.
          </p>

          <template v-else>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <li
                v-for="item in perluPerhatianTampil"
                :key="item.id + item.alasan"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ink-50 dark:bg-ink-900/40 min-w-0"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :class="statusStyle[item.status].dot"></span>
                <div class="min-w-0 flex-1">
                  <p class="text-[13.5px] font-medium dark:text-white truncate">{{ item.nama }}</p>
                  <p class="text-[12.5px] text-ink-500 dark:text-ink-300 truncate">{{ item.alasan }}</p>
                </div>
              </li>
            </ul>

            <button
              v-if="totalPerluPerhatian > BATAS_TAMPIL_PERHATIAN"
              type="button"
              @click="toggleTampilanPerhatian"
              class="mt-2 text-[13px] font-medium text-brand-600 dark:text-brand-400 hover:underline py-1"
            >
              {{ tampilkanSemuaPerhatian ? 'Tampilkan lebih sedikit' : `Lihat semua (${totalPerluPerhatian})` }}
            </button>
          </template>
        </div>
      </div>
    </section>

    <!-- ===================== KARTU STATISTIK ===================== -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <!-- Total ikan hidup -->
      <div :class="card">
        <div class="flex items-start justify-between">
          <div class="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" class="text-brand-600 dark:text-brand-400">
              <path d="M3 12s3.5-5 9-5c3.2 0 5.6 1.7 7 3.2.7.7 1 1.1 1 1.8s-.3 1.1-1 1.8c-1.4 1.5-3.8 3.2-7 3.2-5.5 0-9-5-9-5Z" />
              <path d="M17 10.2 20 8m-3 5.8 3 2.2" />
              <circle cx="8.5" cy="11" r=".9" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span
            v-if="labelPerbandingan(data.perbandingan?.ikanHidup?.persen)"
            class="text-[11px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.ikanHidup?.persen, false)"
          >
            {{ labelPerbandingan(data.perbandingan.ikanHidup.persen) }}
          </span>
        </div>
        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Total ikan hidup</p>
        <p class="text-[22px] lg:text-[24px] leading-tight font-bold mt-0.5 dark:text-white">
          {{ data.statistik.totalIkanHidup.toLocaleString('id-ID') }}
          <span class="text-sm font-medium text-ink-500 dark:text-ink-300">ekor</span>
        </p>
        <div class="mt-4">
          <div class="h-1.5 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
            <div class="h-full bg-brand-500 dark:bg-brand-400 rounded-full" :style="{ width: persenKolamAktif + '%' }"></div>
          </div>
          <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-2">
            {{ data.statistik.kolamAktif }} dari {{ data.statistik.totalKolam }} kolam aktif
            <span v-if="data.statistik.kolamKosong">· {{ data.statistik.kolamKosong }} kosong</span>
          </p>
        </div>
      </div>

      <!-- Penjualan -->
      <div :class="card">
        <div class="flex items-start justify-between">
          <div class="w-10 h-10 rounded-lg bg-gold-100 dark:bg-gold-500/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" class="text-gold-600 dark:text-gold-400">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </div>
          <span
            v-if="labelPerbandingan(data.perbandingan?.penjualan?.persen)"
            class="text-[11px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.penjualan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.penjualan.persen) }}
          </span>
        </div>
        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Penjualan bulan ini</p>
        <p class="text-[22px] lg:text-[24px] leading-tight font-bold mt-0.5 text-gold-600 dark:text-gold-400 break-words">
          {{ rupiah(data.statistik.penjualanBulanIni) }}
        </p>
        <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-4">
          Bulan lalu {{ rupiah(data.perbandingan?.penjualan?.bulanLalu || 0) }}
        </p>
      </div>

      <!-- Keuntungan -->
      <div :class="[card, 'sm:col-span-2 lg:col-span-1']">
        <div class="flex items-start justify-between">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center"
            :class="data.statistik.keuntunganBulanIni >= 0 ? 'bg-ok-100 dark:bg-ok-500/15' : 'bg-danger-100 dark:bg-danger-500/15'"
          >
            <svg
              viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"
              :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-ok-600 dark:text-ok-400' : 'text-danger-600 dark:text-danger-400'"
            >
              <path d="M3 17 9 11l4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
          </div>
          <span
            v-if="labelPerbandingan(data.perbandingan?.keuntungan?.persen)"
            class="text-[11px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.keuntungan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.keuntungan.persen) }}
          </span>
        </div>
        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Keuntungan bulan ini</p>
        <p
          class="text-[22px] lg:text-[24px] leading-tight font-bold mt-0.5 break-words"
          :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-500'"
        >
          {{ rupiah(data.statistik.keuntunganBulanIni) }}
        </p>
        <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-4">
          Masuk {{ rupiah(data.statistik.penjualanBulanIni) }} · Keluar {{ rupiah(data.statistik.pengeluaranBulanIni) }}
        </p>
      </div>
    </div>

    <!-- ===================== KONTEN UTAMA (2 kolom di layar lebar) ===================== -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 xl:items-start">
      <!-- Kolom kiri: grafik + ikan per kolam -->
      <div class="xl:col-span-2 space-y-4 sm:space-y-5 min-w-0">
        <!-- Grafik dengan tab -->
        <section :class="card">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 class="text-[15px] font-semibold dark:text-white">
                {{ grafikAktif === 'penjualan' ? 'Penjualan per bulan' : 'Keuntungan per bulan' }}
              </h2>
              <p class="text-[12.5px] text-ink-500 dark:text-ink-300">6 bulan terakhir</p>
            </div>
            <div class="inline-flex rounded-lg border border-ink-100 dark:border-ink-500 p-0.5" role="tablist">
              <button
                v-for="t in [{ k: 'penjualan', l: 'Penjualan' }, { k: 'keuntungan', l: 'Keuntungan' }]"
                :key="t.k"
                type="button"
                role="tab"
                :aria-selected="grafikAktif === t.k"
                class="px-3 py-1 rounded-md text-[12.5px] font-medium transition"
                :class="grafikAktif === t.k
                  ? 'bg-brand-500 text-white'
                  : 'text-ink-500 dark:text-ink-300 hover:text-ink-700 dark:hover:text-white'"
                @click="grafikAktif = t.k"
              >
                {{ t.l }}
              </button>
            </div>
          </div>
          <div class="h-56 sm:h-64">
            <Line :data="grafikData" :options="chartOptions" />
          </div>
        </section>

        <!-- Ikan per kolam -->
        <section v-if="ikanPerKolam.length > 0" :class="card">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <h2 class="text-[15px] font-semibold dark:text-white">Ikan per kolam</h2>
            <span class="text-[12px] text-ink-500 dark:text-ink-300">Diurutkan dari survival rate terendah</span>
          </div>

          <table class="w-full text-[13px] sm:text-[13.5px]">
            <thead>
              <tr class="text-left text-[12.5px] text-ink-500 dark:text-ink-300 border-b border-ink-100 dark:border-ink-500">
                <th class="py-2 pr-3 font-medium">Kolam</th>
                <th class="py-2 pr-3 font-medium hidden sm:table-cell">Jenis ikan</th>
                <th class="py-2 pr-3 font-medium text-right hidden md:table-cell">Bibit awal</th>
                <th class="py-2 pr-3 font-medium text-right">Hidup</th>
                <th class="py-2 pr-3 font-medium text-right hidden md:table-cell">Tebar</th>
                <th class="py-2 font-medium w-32 sm:w-44">Survival</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="k in ikanPerKolamUrut"
                :key="k.kolamId"
                class="border-b border-ink-100 dark:border-ink-500 last:border-0"
              >
                <td class="py-2.5 pr-3">
                  <p class="font-medium dark:text-white">{{ k.namaKolam }}</p>
                  <p class="text-[12px] text-ink-500 dark:text-ink-300 sm:hidden">{{ k.namaIkan }}</p>
                </td>
                <td class="py-2.5 pr-3 dark:text-ink-100 hidden sm:table-cell">{{ k.namaIkan }}</td>
                <td class="py-2.5 pr-3 text-right tabular-nums dark:text-ink-100 hidden md:table-cell">{{ k.jumlahBibit.toLocaleString('id-ID') }}</td>
                <td class="py-2.5 pr-3 text-right tabular-nums dark:text-ink-100">{{ k.jumlahSaatIni.toLocaleString('id-ID') }}</td>
                <td class="py-2.5 pr-3 text-right hidden md:table-cell">
                  <p class="tabular-nums dark:text-ink-100">{{ tanggalTebar(k) }}</p>
                  <p v-if="umurKolamLabel(k)" class="text-[11px] text-ink-500 dark:text-ink-300">{{ umurKolamLabel(k) }}</p>
                </td>
                <td class="py-2.5">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 flex-1 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
                      <div class="h-full rounded-full" :class="barSurvival(k.survivalRate)" :style="{ width: Math.min(k.survivalRate, 100) + '%' }"></div>
                    </div>
                    <span class="font-semibold w-10 text-right tabular-nums" :class="warnaSurvival(k.survivalRate)">{{ k.survivalRate }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-ink-200 dark:border-ink-500">
                <td class="pt-3 pr-3 font-semibold dark:text-white">
                  Total
                  <span class="block text-[12px] font-normal text-ink-500 dark:text-ink-300">{{ ikanPerKolam.length }} kolam</span>
                </td>
                <td class="hidden sm:table-cell"></td>
                <td class="pt-3 pr-3 text-right font-semibold tabular-nums dark:text-white hidden md:table-cell">{{ totalIkanPerKolam.totalBibit.toLocaleString('id-ID') }}</td>
                <td class="pt-3 pr-3 text-right font-semibold tabular-nums dark:text-white">{{ totalIkanPerKolam.totalSekarang.toLocaleString('id-ID') }}</td>
                <td class="hidden md:table-cell"></td>
                <td class="pt-3 text-right font-semibold tabular-nums" :class="warnaSurvival(totalIkanPerKolam.rataSurvival)">{{ totalIkanPerKolam.rataSurvival }}%</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>

      <!-- Kolom kanan: jadwal + pengeluaran -->
      <div class="space-y-4 sm:space-y-5 min-w-0">
        <!-- Jadwal mendatang -->
        <section :class="card">
          <h2 class="text-[15px] font-semibold dark:text-white mb-3">Jadwal mendatang</h2>

          <div v-if="jadwalGabungan.length === 0">
            <p class="text-[13.5px] font-semibold dark:text-white">Belum ada jadwal mendatang</p>
            <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-0.5">
              Buat jadwal sortir atau panen supaya tidak ada kolam yang terlewat.
            </p>
          </div>

          <ul v-else class="divide-y divide-ink-100 dark:divide-ink-500">
            <li v-for="j in jadwalGabungan.slice(0, 6)" :key="j.kolam_id" class="py-3 first:pt-0 last:pb-0">
              <div class="flex items-baseline justify-between gap-2">
                <p class="text-[13.5px] font-medium dark:text-white truncate">{{ j.nama_kolam }}</p>
                <p class="text-[12px] text-ink-500 dark:text-ink-300 shrink-0">
                  {{ j.nama_ikan }}<span v-if="j.jumlah"> · {{ Number(j.jumlah).toLocaleString('id-ID') }}</span>
                </p>
              </div>
              <div class="mt-1.5 space-y-1">
                <div
                  v-for="e in [
                    { label: 'Sortir', tgl: j.tanggal_sortir, dot: 'bg-brand-500' },
                    { label: 'Panen', tgl: j.tanggal_panen, dot: 'bg-gold-500' }
                  ]"
                  :key="e.label"
                  class="flex items-center gap-2 text-[12.5px]"
                >
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="e.dot"></span>
                  <template v-if="e.tgl">
                    <span class="text-ink-500 dark:text-ink-300">{{ e.label }} · {{ tanggal(e.tgl) }}</span>
                    <span class="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full" :class="chipUrgensi(e.tgl)">
                      {{ labelUrgensi(e.tgl) }}
                    </span>
                  </template>
                  <span v-else class="text-ink-400">{{ e.label }} belum dijadwalkan</span>
                </div>
              </div>
            </li>
          </ul>
          <p v-if="jadwalGabungan.length > 6" class="text-[12px] text-ink-500 dark:text-ink-300 mt-3">
            +{{ jadwalGabungan.length - 6 }} kolam lainnya
          </p>
        </section>

        <!-- Rincian pengeluaran -->
        <section v-if="pengeluaranBreakdown.length > 0" :class="card">
          <div class="flex items-baseline justify-between gap-2 mb-3">
            <h2 class="text-[15px] font-semibold dark:text-white">Pengeluaran bulan ini</h2>
          </div>

          <div class="relative h-44 w-full max-w-[200px] mx-auto">
            <Doughnut :data="chartPengeluaranDonut" :options="donutOptions" />
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p class="text-[11px] text-ink-500 dark:text-ink-300">Total biaya</p>
              <p class="text-[14px] font-bold dark:text-white">{{ rupiah(totalPengeluaranBreakdown) }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-2.5 mt-4">
            <div v-for="r in pengeluaranBreakdown" :key="r.kategori" class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="WARNA_KATEGORI[r.kategori] || 'bg-ink-400'"></span>
              <span class="text-[13px] dark:text-white flex-1 min-w-0 truncate">{{ r.label }}</span>
              <span class="text-[13px] font-semibold dark:text-white shrink-0">{{ rupiah(r.total) }}</span>
              <span class="text-[12px] text-ink-500 dark:text-ink-300 w-9 text-right shrink-0">
                {{ Math.round((r.total / totalPengeluaranBreakdown) * 100) }}%
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
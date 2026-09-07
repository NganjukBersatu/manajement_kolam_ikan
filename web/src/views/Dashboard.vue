<script setup>
import { ref, onMounted, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
)

const loading = ref(true)
const data = ref(null)
const jadwalGabungan = ref([])

function rupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID')
}
function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const badgeJenis = {
  pakan: 'bg-gold-100 text-gold-600',
  panen: 'bg-ok-100 text-ok-600',
  sortir: 'bg-brand-50 text-brand-600',
  tebar: 'bg-warn-100 text-warn-600'
}
function kelasBadge(jenis) {
  return badgeJenis[jenis] || 'bg-ink-100 text-ink-500'
}

const persenKolamAktif = computed(() => {
  if (!data.value) return 0
  const total = data.value.statistik.totalKolam || 0
  const aktif = data.value.statistik.kolamAktif || 0
  return total === 0 ? 0 : Math.round((aktif / total) * 100)
})

// ===================== CHART (biarkan seperti sebelumnya) =====================
const chartLabels = ['Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep']

const chartPenjualan = ref({
  labels: chartLabels,
  datasets: [{
    label: 'Penjualan',
    data: [420000, 580000, 710000, 650000, 890000, 854000],
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    fill: true,
    tension: 0.35,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2.5
  }]
})

const chartKeuntungan = ref({
  labels: chartLabels,
  datasets: [{
    label: 'Keuntungan',
    data: [180000, 240000, 310000, 275000, 480000, 454000],
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    fill: true,
    tension: 0.35,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderWidth: 2.5
  }]
})

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
      ticks: { color: '#94a3b8', font: { size: 12 } }
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
      ticks: {
        color: '#94a3b8',
        font: { size: 12 },
        callback: (v) => {
          if (v >= 1000000) return (v / 1000000) + 'jt'
          if (v >= 1000) return (v / 1000) + 'rb'
          return v
        }
      }
    }
  }
}

// ===================== LOAD DATA =====================
async function muat() {
  loading.value = true

  // Ambil data dashboard (statistik + grafik)
  const resDashboard = await fetch('/api/dashboard')
  data.value = await resDashboard.json()

  // Ambil data Sortir & Panen
  const [resSortir, resPanen] = await Promise.all([
    fetch('/api/jadwal?jenis=sortir'),
    fetch('/api/jadwal?jenis=panen')
  ])

  const jsonSortir = await resSortir.json()
  const jsonPanen = await resPanen.json()

  const sortir = jsonSortir.data || []
  const panen = jsonPanen.data || []

  // Gabungkan berdasarkan kolam_id
  const map = {}

  // Masukkan data sortir
  sortir.forEach(item => {
    if (item.status === 'selesai') return // hanya yang belum selesai

    const key = item.kolam_id
    if (!map[key]) {
      map[key] = {
        kolam_id: item.kolam_id,
        nama_kolam: item.nama_kolam,
        nama_ikan: item.nama_ikan,
        jumlah: item.jumlah_saat_ini,
        tanggal_sortir: item.tanggal_jadwal,
        tanggal_panen: null
      }
    } else {
      map[key].tanggal_sortir = item.tanggal_jadwal
      map[key].jumlah = item.jumlah_saat_ini
    }
  })

  // Masukkan data panen
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
        tanggal_panen: item.tanggal_jadwal
      }
    } else {
      map[key].tanggal_panen = item.tanggal_jadwal
      // prioritaskan jumlah dari sortir kalau sudah ada
      if (!map[key].jumlah) map[key].jumlah = item.jumlah_saat_ini
    }
  })

  // Ubah jadi array dan urutkan berdasarkan tanggal terdekat
  jadwalGabungan.value = Object.values(map).sort((a, b) => {
    const tglA = a.tanggal_sortir || a.tanggal_panen
    const tglB = b.tanggal_sortir || b.tanggal_panen
    return new Date(tglA) - new Date(tglB)
  })

  loading.value = false
}

onMounted(muat)
</script>

<template>
  <div v-if="loading" class="text-[13.5px] text-ink-500">Memuat...</div>

  <div v-else class="space-y-5">
    <!-- Baris utama: kartu hero + kartu ringkas -->
    <div class="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
      <!-- Hero: Total Ikan Hidup -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5 flex flex-col justify-between">
        <div>
          <p class="text-[13px] text-ink-500 dark:text-ink-300">Total ikan hidup</p>
          <p class="text-4xl font-bold mt-1 dark:text-white">
            {{ data.statistik.totalIkanHidup.toLocaleString('id-ID') }}
            <span class="text-base font-medium text-ink-500 dark:text-ink-300">ekor</span>
          </p>
        </div>
        <div class="mt-5">
          <div class="h-1.5 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
            <div class="h-full bg-brand-500 dark:bg-brand-400 rounded-full" :style="{ width: persenKolamAktif + '%' }"></div>
          </div>
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mt-2">
            {{ data.statistik.kolamAktif }} dari {{ data.statistik.totalKolam }} kolam aktif
            <span v-if="data.statistik.kolamKosong">· {{ data.statistik.kolamKosong }} kosong</span>
          </p>
        </div>
      </div>

      <!-- Kartu ringkas -->
      <div class="flex flex-col gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4 flex-1 flex flex-col justify-center">
          <p class="text-[13px] text-ink-500 dark:text-ink-300">Penjualan bulan ini</p>
          <p class="text-xl font-bold text-gold-600 dark:text-gold-400 mt-1">
            {{ rupiah(data.statistik.penjualanBulanIni) }}
          </p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4 flex-1 flex flex-col justify-center">
          <p class="text-[13px] text-ink-500 dark:text-ink-300">Keuntungan bulan ini</p>
          <p
            class="text-xl font-bold mt-1"
            :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-500'"
          >
            {{ rupiah(data.statistik.keuntunganBulanIni) }}
          </p>
        </div>
      </div>
    </div>

    <!-- ===================== GRAFIK ===================== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Grafik Penjualan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[15px] font-semibold dark:text-white">Penjualan per Bulan</h2>
          <span class="text-[12px] text-ink-500 dark:text-ink-300">6 bulan terakhir</span>
        </div>
        <div class="h-56">
          <Line :data="chartPenjualan" :options="chartOptions" />
        </div>
      </div>

      <!-- Grafik Keuntungan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[15px] font-semibold dark:text-white">Keuntungan per Bulan</h2>
          <span class="text-[12px] text-ink-500 dark:text-ink-300">6 bulan terakhir</span>
        </div>
        <div class="h-56">
          <Line :data="chartKeuntungan" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Jadwal Mendatang -->
<div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
  <h2 class="text-[15px] font-semibold dark:text-white mb-4">Jadwal mendatang</h2>

  <div v-if="jadwalGabungan.length === 0" class="flex items-center gap-4 py-2">
    <div class="w-11 h-11 rounded-card bg-gold-100 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" class="text-gold-600">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    </div>
    <div>
      <p class="text-[13.5px] font-semibold dark:text-white">Belum ada jadwal mendatang</p>
      <p class="text-[13px] text-ink-500 dark:text-ink-300">Buat jadwal sortir atau panen supaya tidak ada kolam yang terlewat.</p>
    </div>
  </div>

  <div v-else>
    <!-- Header -->
    <div class="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 text-[13px] text-ink-500 dark:text-ink-300 font-medium pb-2 border-b border-ink-100 dark:border-ink-500">
  <div class="min-w-0">Kolam</div>
  <div class="min-w-0">Jenis Ikan</div>
  <div class="min-w-0 pr-16">Jumlah Ikan</div>
  <div class="min-w-0 pl-15">Tanggal Sortir</div>
  <div class="min-w-0">Tanggal Panen</div>
</div>

    <!-- Body -->
  <div
  v-for="j in jadwalGabungan"
  :key="j.kolam_id"
  class="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4 text-[13.5px] py-2.5 border-b border-ink-100 dark:border-ink-500 last:border-0 items-center"
>
  <div class="min-w-0 font-medium dark:text-white">{{ j.nama_kolam }}</div>
  <div class="min-w-0 dark:text-ink-100">{{ j.nama_ikan }}</div>
  <div class="min-w-0 pr-16 dark:text-ink-100">
    {{ j.jumlah ? Number(j.jumlah).toLocaleString('id-ID') + ' ekor' : '-' }}
  </div>
  <div class="min-w-0 pl-15">
  <span v-if="j.tanggal_sortir" class="text-white">
    {{ tanggal(j.tanggal_sortir) }}
  </span>
  <span v-else class="text-ink-400">-</span>
</div>
  <div class="min-w-0">
    <span v-if="j.tanggal_panen" class="text-white">
      {{ tanggal(j.tanggal_panen) }}
    </span>
    <span v-else class="text-ink-400">-</span>
  </div>
</div> 
  
  

</div>
</div>
</div>
</template>
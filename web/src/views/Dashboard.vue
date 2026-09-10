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
const pakanSesi = ref([])       // [{ nama: 'Pagi', sudah, belum, terlambat }, ...]
const perluPerhatian = ref([])  // daftar kolam yang butuh aksi hari ini

function rupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID')
}
function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
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

const pengeluaranBreakdown = computed(() => data.value?.pengeluaranBreakdown || [])
const totalPengeluaranBreakdown = computed(() =>
  pengeluaranBreakdown.value.reduce((sum, r) => sum + r.total, 0)
)

const ikanPerKolam = computed(() => data.value?.ikanPerKolam || [])

// Indikator naik/turun dibanding periode sebelumnya
function labelPerbandingan(persen) {
  if (persen === null || persen === undefined) return null
  const arah = persen > 0 ? '↑' : persen < 0 ? '↓' : '→'
  return `${arah} ${Math.abs(persen)}% dari bulan lalu`
}
// baik=true berarti "naik itu bagus" (penjualan, keuntungan).
// Untuk ikan hidup, naik/turun sama-sama netral (turun bisa karena panen yang wajar),
// jadi warnanya dibuat netral saja, bukan merah/hijau.
function warnaPerbandingan(persen, baik = true) {
  if (persen === null || persen === undefined || persen === 0) return 'text-ink-500 dark:text-ink-300'
  const naik = persen > 0
  if (!baik) return 'text-ink-500 dark:text-ink-300'
  return naik ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-500'
}

// Ambang batas survival rate untuk pewarnaan. SESUAIKAN dengan standar budidaya kamu.
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

const badgeJenis = {
  pakan: 'bg-gold-100 text-gold-600',
  panen: 'bg-ok-100 text-ok-600',
  sortir: 'bg-brand-50 text-brand-600',
  tebar: 'bg-warn-100 text-warn-600'
}
function kelasBadge(jenis) {
  return badgeJenis[jenis] || 'bg-ink-100 text-ink-500'
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

  // Ambil data Sortir, Panen, dan ringkasan Pakan hari ini
  const [resSortir, resPanen, resPakan] = await Promise.all([
    fetch('/api/jadwal?jenis=sortir'),
    fetch('/api/jadwal?jenis=panen'),
    fetch('/api/pakan/ringkasan-hari-ini')
  ])

  const jsonSortir = await resSortir.json()
  const jsonPanen = await resPanen.json()
  const jsonPakan = await resPakan.json().catch(() => ({ data: [] }))

  const sortir = jsonSortir.data || []
  const panen = jsonPanen.data || []
  const pakan = jsonPakan.data || []

  // ---------- Jadwal mendatang (sortir + panen) ----------
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

  // ---------- Ringkasan hari ini: status pakan per sesi ----------
  // Nilai `sesi` dari API adalah lowercase ('pagi'/'siang'/'sore') sesuai constraint DB
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

  // ---------- Ringkasan hari ini: kolam yang butuh perhatian ----------
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

  loading.value = false
}

onMounted(muat)
</script>

<template>
  <div v-if="loading" class="text-[13.5px] text-ink-500">Memuat...</div>

  <div v-else class="space-y-5">
    <!-- ===================== RINGKASAN HARI INI ===================== -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <div class="flex items-center justify-between mb-4">
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

      <!-- Chip status pakan per sesi -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div
          v-for="sesi in pakanSesi"
          :key="sesi.nama"
          class="rounded-lg border p-3"
          :class="sesi.terlambat > 0
            ? statusStyle.terlambat.chip
            : sesi.belum > 0
              ? statusStyle.belum.chip
              : statusStyle.sudah.chip"
        >
          <p class="text-[12px] opacity-80">{{ sesi.nama }}</p>
          <p class="text-[14px] font-semibold mt-0.5">
            <template v-if="sesi.terlambat > 0">{{ sesi.terlambat }} terlambat</template>
            <template v-else-if="sesi.belum > 0">{{ sesi.belum }} belum</template>
            <template v-else>Selesai</template>
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="totalPerluPerhatian === 0" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-1">
        Semua kolam sudah ditangani hari ini. Tidak ada yang tertunda.
      </div>

      <!-- Daftar kolam perlu perhatian -->
      <ul v-else class="flex flex-col gap-1.5">
        <li
          v-for="item in perluPerhatian"
          :key="item.id + item.alasan"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ink-50 dark:bg-ink-900/40 cursor-pointer hover:bg-ink-100 dark:hover:bg-ink-900/70 transition"
        >
          <span class="w-2 h-2 rounded-full shrink-0" :class="statusStyle[item.status].dot"></span>
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-medium dark:text-white truncate">{{ item.nama }}</p>
            <p class="text-[12.5px] text-ink-500 dark:text-ink-300 truncate">{{ item.alasan }}</p>
          </div>
          <span class="text-ink-400">›</span>
        </li>
      </ul>
    </div>

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
          <p
            v-if="labelPerbandingan(data.perbandingan?.ikanHidup?.persen)"
            class="text-[12.5px] mt-1"
            :class="warnaPerbandingan(data.perbandingan?.ikanHidup?.persen, false)"
          >
            {{ labelPerbandingan(data.perbandingan.ikanHidup.persen) }}
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
          <p
            v-if="labelPerbandingan(data.perbandingan?.penjualan?.persen)"
            class="text-[12px] mt-1"
            :class="warnaPerbandingan(data.perbandingan?.penjualan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.penjualan.persen) }}
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
          <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-1">
            Pemasukan {{ rupiah(data.statistik.penjualanBulanIni) }} · Pengeluaran {{ rupiah(data.statistik.pengeluaranBulanIni) }}
          </p>
          <p
            v-if="labelPerbandingan(data.perbandingan?.keuntungan?.persen)"
            class="text-[12px] mt-1"
            :class="warnaPerbandingan(data.perbandingan?.keuntungan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.keuntungan.persen) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Ikan per Kolam -->
    <div
      v-if="ikanPerKolam.length > 0"
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5"
    >
      <h2 class="text-[15px] font-semibold dark:text-white mb-4">Ikan per kolam</h2>

      <div class="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-4 text-[13px] text-ink-500 dark:text-ink-300 font-medium pb-2 border-b border-ink-100 dark:border-ink-500">
        <div>Kolam</div>
        <div>Jenis Ikan</div>
        <div>Bibit Awal</div>
        <div>Hidup Sekarang</div>
        <div>Survival Rate</div>
      </div>

      <div
        v-for="k in ikanPerKolam"
        :key="k.kolamId"
        class="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_1fr] gap-4 text-[13.5px] py-2.5 border-b border-ink-100 dark:border-ink-500 last:border-0 items-center"
      >
        <div class="font-medium dark:text-white">{{ k.namaKolam }}</div>
        <div class="dark:text-ink-100">{{ k.namaIkan }}</div>
        <div class="dark:text-ink-100">{{ k.jumlahBibit.toLocaleString('id-ID') }}</div>
        <div class="dark:text-ink-100">{{ k.jumlahSaatIni.toLocaleString('id-ID') }}</div>
        <div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 flex-1 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="barSurvival(k.survivalRate)"
                :style="{ width: Math.min(k.survivalRate, 100) + '%' }"
              ></div>
            </div>
            <span class="font-semibold w-11 text-right" :class="warnaSurvival(k.survivalRate)">
              {{ k.survivalRate }}%
            </span>
          </div>
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

    <!-- Rincian Pengeluaran Bulan Ini -->
    <div
      v-if="pengeluaranBreakdown.length > 0"
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[15px] font-semibold dark:text-white">Rincian pengeluaran bulan ini</h2>
        <span class="text-[12px] text-ink-500 dark:text-ink-300">Total {{ rupiah(totalPengeluaranBreakdown) }}</span>
      </div>
      <div class="flex flex-col gap-3">
        <div v-for="r in pengeluaranBreakdown" :key="r.kategori">
          <div class="flex items-center justify-between text-[13.5px] mb-1">
            <span class="dark:text-white">{{ r.label }}</span>
            <span class="text-ink-500 dark:text-ink-300">{{ rupiah(r.total) }}</span>
          </div>
          <div class="h-1.5 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
            <div
              class="h-full rounded-full"
              :class="WARNA_KATEGORI[r.kategori] || 'bg-ink-400'"
              :style="{ width: Math.round((r.total / totalPengeluaranBreakdown) * 100) + '%' }"
            ></div>
          </div>
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
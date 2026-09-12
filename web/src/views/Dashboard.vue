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
const pakanSesi = ref([])       // [{ nama: 'Pagi', sudah, belum, terlambat }, ...]
const perluPerhatian = ref([])  // daftar kolam yang butuh aksi hari ini

// ===================== PAGINATION "PERLU PERHATIAN" =====================
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
  return 'Rp' + Number(n).toLocaleString('id-ID')
}
function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

// ===================== URGENSI TANGGAL (dipakai di Jadwal Mendatang) =====================
// Menghitung selisih hari dari hari ini ke tanggal target, lalu memberi label + warna
// supaya orang bisa langsung lihat mana yang mendesak tanpa harus menghitung sendiri.
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

// ===================== UMUR KOLAM (dipakai di tabel Ikan per Kolam) =====================
// Menghitung sudah berapa hari sejak tanggal tebar. Dipakai sebagai info pendamping
// tanggal tebar supaya tidak perlu menghitung manual usia budidaya berjalan.
function umurHari(tanggalTebar) {
  const selisih = selisihHari(tanggalTebar)
  if (selisih === null) return null
  return Math.abs(selisih) // tanggal tebar selalu di masa lalu/hari ini
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
// Versi hex dari warna kategori, dipakai khusus untuk chart donut (Chart.js butuh hex, bukan class Tailwind)
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

// Diurutkan dari survival rate PALING RENDAH -> paling tinggi, supaya kolam yang
// paling butuh perhatian langsung terlihat di baris paling atas, bukan tersembunyi
// di tengah urutan alfabetis.
const ikanPerKolamUrut = computed(() =>
  [...ikanPerKolam.value].sort((a, b) => a.survivalRate - b.survivalRate)
)

// Baris Total/Ringkasan di bawah tabel Ikan per Kolam
const totalIkanPerKolam = computed(() => {
  const list = ikanPerKolam.value
  const totalBibit = list.reduce((sum, k) => sum + (k.jumlahBibit || 0), 0)
  const totalSekarang = list.reduce((sum, k) => sum + (k.jumlahSaatIni || 0), 0)
  const rataSurvival = totalBibit === 0 ? 0 : Math.round((totalSekarang / totalBibit) * 100)
  return { totalBibit, totalSekarang, rataSurvival }
})

// Tanggal tebar per kolam. Sesuaikan nama field k.tanggalTebar dengan yang
// dikembalikan endpoint /api/dashboard jika field aslinya berbeda.
function tanggalTebar(k) {
  return k.tanggalTebar ? tanggal(k.tanggalTebar) : '-'
}
function umurKolamLabel(k) {
  if (!k.tanggalTebar) return ''
  const hari = umurHari(k.tanggalTebar)
  return hari === null ? '' : `${hari} hari`
}

// ===================== DONUT: RINCIAN PENGELUARAN =====================
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

// Indikator naik/turun dibanding periode sebelumnya
function labelPerbandingan(persen) {
  if (persen === null || persen === undefined) return null
  const arah = persen > 0 ? '↑' : persen < 0 ? '↓' : '→'
  return `${arah} ${Math.abs(persen)}%`
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
// Chip warna untuk badge trend (background lembut + teks kuat), dipakai di kartu statistik gaya baru
function chipPerbandingan(persen, baik = true) {
  if (persen === null || persen === undefined || persen === 0) return 'bg-ink-100 text-ink-500 border border-ink-200'
  const naik = persen > 0
  if (!baik) return 'bg-ink-100 text-ink-500 border border-ink-200'
  return naik ? 'bg-ok-100 text-ok-600 border border-ok-200' : 'bg-danger-100 text-danger-600 border border-danger-200'
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

// ===================== CHART (data diambil dari /api/dashboard/grafik-bulanan) =====================
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

// Data mentah keuntungan bulanan (dipakai chartKeuntungan computed di bawah agar warnanya bisa dinamis)
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

// ===================== LOAD DATA =====================
async function muat() {
  loading.value = true

  // Ambil data dashboard (statistik + grafik)
  const resDashboard = await fetch('/api/dashboard')
  data.value = await resDashboard.json()

  // Ambil data Sortir, Panen, ringkasan Pakan hari ini, dan grafik bulanan
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

  // ---------- Grafik penjualan & keuntungan 6 bulan terakhir (data asli) ----------
  chartPenjualan.value = {
    labels: jsonGrafik.labels || [],
    datasets: [{ ...chartPenjualan.value.datasets[0], data: jsonGrafik.penjualan || [] }]
  }
  dataKeuntunganBulanan.value = {
    labels: jsonGrafik.labels || [],
    values: jsonGrafik.keuntungan || []
  }

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

  // Reset tampilan "lihat semua" setiap kali data dimuat ulang
  tampilkanSemuaPerhatian.value = false

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

      <!-- Daftar kolam perlu perhatian (dibatasi 5, bisa "Lihat semua") -->
      <template v-else>
        <ul class="flex flex-col gap-1.5">
          <li
            v-for="item in perluPerhatianTampil"
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

        <!-- Tombol lihat semua / tampilkan lebih sedikit -->
        <button
          v-if="totalPerluPerhatian > BATAS_TAMPIL_PERHATIAN"
          type="button"
          @click="toggleTampilanPerhatian"
          class="mt-3 w-full text-center text-[13px] font-medium text-brand-600 dark:text-brand-400 hover:underline py-1.5 transition"
        >
          {{ tampilkanSemuaPerhatian ? 'Tampilkan lebih sedikit ▲' : `Lihat semua (${totalPerluPerhatian}) ▼` }}
        </button>
      </template>
    </div>

    <!-- ===================== KARTU STATISTIK (icon + trend, gaya baru) ===================== -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total ikan hidup -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
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
            class="text-[11.5px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.ikanHidup?.persen, false)"
          >
            {{ labelPerbandingan(data.perbandingan.ikanHidup.persen) }}
          </span>
        </div>

        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Total ikan hidup</p>
        <p class="text-[26px] leading-tight font-bold mt-0.5 dark:text-white">
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

      <!-- Penjualan bulan ini -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <div class="flex items-start justify-between">
          <div class="w-10 h-10 rounded-lg bg-gold-100 dark:bg-gold-500/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" class="text-gold-600 dark:text-gold-400">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </div>
          <span
            v-if="labelPerbandingan(data.perbandingan?.penjualan?.persen)"
            class="text-[11.5px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.penjualan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.penjualan.persen) }}
          </span>
        </div>

        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Penjualan bulan ini</p>
        <p class="text-[26px] leading-tight font-bold mt-0.5 text-gold-600 dark:text-gold-400">
          {{ rupiah(data.statistik.penjualanBulanIni) }}
        </p>
        <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-4">
          Bulan lalu {{ rupiah(data.perbandingan?.penjualan?.bulanLalu || 0) }}
        </p>
      </div>

      <!-- Keuntungan bulan ini -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
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
            class="text-[11.5px] font-semibold px-2 py-1 rounded-full"
            :class="chipPerbandingan(data.perbandingan?.keuntungan?.persen, true)"
          >
            {{ labelPerbandingan(data.perbandingan.keuntungan.persen) }}
          </span>
        </div>

        <p class="text-[13px] text-ink-500 dark:text-ink-300 mt-3">Keuntungan bulan ini</p>
        <p
          class="text-[26px] leading-tight font-bold mt-0.5"
          :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-500'"
        >
          {{ rupiah(data.statistik.keuntunganBulanIni) }}
        </p>
        <p class="text-[12px] text-ink-500 dark:text-ink-300 mt-4">
          Pemasukan {{ rupiah(data.statistik.penjualanBulanIni) }} · Pengeluaran {{ rupiah(data.statistik.pengeluaranBulanIni) }}
        </p>
      </div>
    </div>

    <!-- ===================== IKAN PER KOLAM (diperbaiki) ===================== -->
    <div
      v-if="ikanPerKolam.length > 0"
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[15px] font-semibold dark:text-white">Ikan per kolam</h2>
        <span class="text-[12px] text-ink-500 dark:text-ink-300">Diurutkan dari survival rate terendah</span>
      </div>

      <!-- Header kolom: angka rata kanan supaya digit sejajar dan mudah dibandingkan -->
      <div class="grid grid-cols-[1.1fr_0.75fr_0.8fr_1fr_0.9fr_1.3fr] gap-3 text-[13px] text-ink-500 dark:text-ink-300 font-medium pb-2 border-b border-ink-100 dark:border-ink-500">
        <div>Kolam</div>
        <div>Jenis Ikan</div>
        <div class="text-right">Bibit Awal</div>
        <div class="text-right">Hidup Sekarang</div>
        <div class="text-right">Tanggal Tebar</div>
        <div>Survival Rate</div>
      </div>

      <!-- Baris data -->
      <div
        v-for="k in ikanPerKolamUrut"
        :key="k.kolamId"
        class="grid grid-cols-[1.1fr_0.75fr_0.8fr_1fr_0.9fr_1.3fr] gap-3 text-[13.5px] py-2.5 border-b border-ink-100 dark:border-ink-500 last:border-0 items-center"
      >
        <div class="font-medium dark:text-white">{{ k.namaKolam }}</div>
        <div class="dark:text-ink-100">{{ k.namaIkan }}</div>
        <div class="dark:text-ink-100 text-right tabular-nums">{{ k.jumlahBibit.toLocaleString('id-ID') }}</div>
        <div class="dark:text-ink-100 text-right tabular-nums">{{ k.jumlahSaatIni.toLocaleString('id-ID') }}</div>
        <div class="text-right">
          <p class="dark:text-ink-100 tabular-nums">{{ tanggalTebar(k) }}</p>
          <p v-if="umurKolamLabel(k)" class="text-[11px] text-ink-500 dark:text-ink-300">{{ umurKolamLabel(k) }}</p>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <div class="h-1.5 flex-1 rounded-full bg-ink-100 dark:bg-ink-900 overflow-hidden">
              <div
                class="h-full rounded-full"
                :class="barSurvival(k.survivalRate)"
                :style="{ width: Math.min(k.survivalRate, 100) + '%' }"
              ></div>
            </div>
            <span class="font-semibold w-11 text-right tabular-nums" :class="warnaSurvival(k.survivalRate)">
              {{ k.survivalRate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Baris Total/Ringkasan -->
      <div class="grid grid-cols-[1.1fr_0.75fr_0.8fr_1fr_0.9fr_1.3fr] gap-3 text-[13.5px] pt-3 mt-1 border-t-2 border-ink-200 dark:border-ink-500 items-center">
        <div class="font-semibold dark:text-white">Total</div>
        <div class="text-[12px] text-ink-500 dark:text-ink-300">{{ ikanPerKolam.length }} kolam</div>
        <div class="font-semibold dark:text-white text-right tabular-nums">
          {{ totalIkanPerKolam.totalBibit.toLocaleString('id-ID') }}
        </div>
        <div class="font-semibold dark:text-white text-right tabular-nums">
          {{ totalIkanPerKolam.totalSekarang.toLocaleString('id-ID') }}
        </div>
        <div></div>
        <div class="font-semibold w-11 text-right tabular-nums" :class="warnaSurvival(totalIkanPerKolam.rataSurvival)">
          {{ totalIkanPerKolam.rataSurvival }}%
        </div>
      </div>
    </div>

    <!-- ===================== GRAFIK ===================== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Grafik Penjualan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-[15px] font-semibold dark:text-white">Penjualan per Bulan</h2>
          <span class="text-[12px] text-ink-500 dark:text-ink-300">6 bulan terakhir</span>
        </div>
        <p class="text-[13px] text-ink-500 dark:text-ink-300 mb-3">
          Bulan ini
          <span class="font-semibold text-gold-600 dark:text-gold-400">{{ rupiah(data.statistik.penjualanBulanIni) }}</span>
        </p>
        <div class="h-56">
          <Line :data="chartPenjualan" :options="chartOptions" />
        </div>
      </div>

      <!-- Grafik Keuntungan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-[15px] font-semibold dark:text-white">Keuntungan per Bulan</h2>
          <span class="text-[12px] text-ink-500 dark:text-ink-300">6 bulan terakhir</span>
        </div>
        <p class="text-[13px] text-ink-500 dark:text-ink-300 mb-3">
          Bulan ini
          <span
            class="font-semibold"
            :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-500'"
          >
            {{ rupiah(data.statistik.keuntunganBulanIni) }}
          </span>
        </p>
        <div class="h-56">
          <Line :data="chartKeuntungan" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- ===================== RINCIAN PENGELUARAN (donut + legenda) ===================== -->
    <div
      v-if="pengeluaranBreakdown.length > 0"
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-[15px] font-semibold dark:text-white">Rincian pengeluaran bulan ini</h2>
        <span class="text-[12px] text-ink-500 dark:text-ink-300">Total {{ rupiah(totalPengeluaranBreakdown) }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6 items-center">
        <!-- Donut -->
        <div class="relative h-52 mx-auto w-full max-w-[220px]">
          <Doughnut :data="chartPengeluaranDonut" :options="donutOptions" />
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p class="text-[11.5px] text-ink-500 dark:text-ink-300">Total biaya</p>
            <p class="text-[15px] font-bold dark:text-white">{{ rupiah(totalPengeluaranBreakdown) }}</p>
          </div>
        </div>

        <!-- Legenda -->
        <div class="flex flex-col gap-3">
          <div v-for="r in pengeluaranBreakdown" :key="r.kategori" class="flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="WARNA_KATEGORI[r.kategori] || 'bg-ink-400'"></span>
            <span class="text-[13.5px] dark:text-white flex-1 min-w-0 truncate">{{ r.label }}</span>
            <span class="text-[13.5px] font-semibold dark:text-white">{{ rupiah(r.total) }}</span>
            <span class="text-[12px] text-ink-500 dark:text-ink-300 w-11 text-right">
              {{ Math.round((r.total / totalPengeluaranBreakdown) * 100) }}%
            </span>
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

      <div v-else class="flex flex-col divide-y divide-ink-100 dark:divide-ink-500">
        <div
          v-for="j in jadwalGabungan"
          :key="j.kolam_id"
          class="flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5 first:pt-0 last:pb-0"
        >
          <!-- Kolam & ikan -->
          <div class="min-w-[150px] flex-1">
            <p class="text-[13.5px] font-medium dark:text-white">{{ j.nama_kolam }}</p>
            <p class="text-[12.5px] text-ink-500 dark:text-ink-300">
              {{ j.nama_ikan }}<span v-if="j.jumlah"> · {{ Number(j.jumlah).toLocaleString('id-ID') }} ekor</span>
            </p>
          </div>

          <!-- Sortir -->
          <div v-if="j.tanggal_sortir" class="flex items-center gap-2.5 min-w-[190px]">
            <div class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" class="text-brand-600 dark:text-brand-400">
                <path d="M6 3 20 17M20 3 6 17" />
                <circle cx="6" cy="19" r="2.2" />
                <circle cx="20" cy="19" r="2.2" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-[12px] text-ink-500 dark:text-ink-300">Sortir · {{ tanggal(j.tanggal_sortir) }}</p>
              <span class="inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" :class="chipUrgensi(j.tanggal_sortir)">
                {{ labelUrgensi(j.tanggal_sortir) }}
              </span>
            </div>
          </div>
          <div v-else class="min-w-[190px] text-[12.5px] text-ink-400">Sortir belum dijadwalkan</div>

          <!-- Panen -->
          <div v-if="j.tanggal_panen" class="flex items-center gap-2.5 min-w-[190px]">
            <div class="w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-500/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" class="text-gold-600 dark:text-gold-400">
                <path d="M4 20c4-8 12-8 16-16" />
                <path d="M9 20c1-3 4-6 8-8" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-[12px] text-ink-500 dark:text-ink-300">Panen · {{ tanggal(j.tanggal_panen) }}</p>
              <span class="inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" :class="chipUrgensi(j.tanggal_panen)">
                {{ labelUrgensi(j.tanggal_panen) }}
              </span>
            </div>
          </div>
          <div v-else class="min-w-[190px] text-[12.5px] text-ink-400">Panen belum dijadwalkan</div>

          <span class="text-ink-400 ml-auto shrink-0">›</span>
        </div>
      </div>
    </div>
  </div>
</template>
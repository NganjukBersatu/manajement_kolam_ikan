<script setup>
import { ref, computed, onMounted } from 'vue'

const daftar = ref([])
const loading = ref(true)

async function muat() {
  loading.value = true
  const res = await fetch('/api/penjualan').then(r => r.json())
  daftar.value = res.data
  loading.value = false
}

// ===== Filter periode =====
const PRESET_PERIODE = [
  { key: 'hari_ini', label: 'Hari Ini' },
  { key: 'kemarin', label: 'Kemarin' },
  { key: '7_hari', label: '7 Hari Terakhir' },
  { key: 'bulan_ini', label: 'Bulan Ini' },
  { key: 'bulan_lalu', label: 'Bulan Lalu' },
  { key: 'semua', label: 'Semua Waktu' },
  { key: 'custom', label: 'Rentang Kustom' }
]

const periodeDipilih = ref('bulan_ini')
const tanggalMulaiCustom = ref('')
const tanggalSelesaiCustom = ref('')

function keTanggalISO(d) {
  return d.toISOString().slice(0, 10)
}

// Menghitung rentang tanggal [mulai, selesai] (format 'YYYY-MM-DD') sesuai preset yang dipilih
const rentangTanggal = computed(() => {
  const now = new Date()
  const hariIni = keTanggalISO(now)

  switch (periodeDipilih.value) {
    case 'hari_ini':
      return { mulai: hariIni, selesai: hariIni }

    case 'kemarin': {
      const kemarin = new Date(now)
      kemarin.setDate(kemarin.getDate() - 1)
      const iso = keTanggalISO(kemarin)
      return { mulai: iso, selesai: iso }
    }

    case '7_hari': {
      const tujuhHariLalu = new Date(now)
      tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 6)
      return { mulai: keTanggalISO(tujuhHariLalu), selesai: hariIni }
    }

    case 'bulan_ini': {
      const awal = new Date(now.getFullYear(), now.getMonth(), 1)
      return { mulai: keTanggalISO(awal), selesai: hariIni }
    }

    case 'bulan_lalu': {
      const awal = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const akhir = new Date(now.getFullYear(), now.getMonth(), 0)
      return { mulai: keTanggalISO(awal), selesai: keTanggalISO(akhir) }
    }

    case 'custom':
      return { mulai: tanggalMulaiCustom.value || null, selesai: tanggalSelesaiCustom.value || null }

    case 'semua':
    default:
      return { mulai: null, selesai: null }
  }
})

const labelPeriode = computed(() => {
  const preset = PRESET_PERIODE.find((p) => p.key === periodeDipilih.value)
  if (periodeDipilih.value === 'custom' && rentangTanggal.value.mulai && rentangTanggal.value.selesai) {
    return `${tanggal(rentangTanggal.value.mulai)} — ${tanggal(rentangTanggal.value.selesai)}`
  }
  return preset?.label || ''
})

// ===== Search & filter tambahan =====
const pencarian = ref('')
const jenisIkanDipilih = ref('')
const kolamDipilih = ref('')

onMounted(muat)

function tanggal(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID')
}

// Data yang sudah difilter berdasarkan rentang tanggal saja (dipakai untuk isi dropdown jenis ikan/kolam)
const dataDalamPeriode = computed(() => {
  const { mulai, selesai } = rentangTanggal.value
  return daftar.value.filter((p) => {
    if (mulai && p.tanggal < mulai) return false
    if (selesai && p.tanggal > selesai) return false
    return true
  })
})

// Daftar jenis ikan unik dalam periode yang dipilih, untuk dropdown filter
const daftarJenisIkan = computed(() => {
  const set = new Set(dataDalamPeriode.value.map((p) => p.nama_ikan).filter(Boolean))
  return Array.from(set).sort()
})

// Daftar kolam unik dalam periode yang dipilih, untuk dropdown filter
const daftarKolamFilter = computed(() => {
  const set = new Set(dataDalamPeriode.value.map((p) => p.nama_kolam).filter(Boolean))
  return Array.from(set).sort()
})

// Data final: periode + pencarian teks + jenis ikan + kolam
const dataTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()

  return dataDalamPeriode.value
    .filter((p) => !jenisIkanDipilih.value || p.nama_ikan === jenisIkanDipilih.value)
    .filter((p) => !kolamDipilih.value || p.nama_kolam === kolamDipilih.value)
    .filter((p) => {
      if (!kataKunci) return true
      const gabungan = `${p.nama_ikan || ''} ${p.nama_kolam || ''} ${p.catatan || ''}`.toLowerCase()
      return gabungan.includes(kataKunci)
    })
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})

const totalPenjualan = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.total), 0)
)

const totalKg = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.jumlah_kg), 0)
)

const jumlahTransaksi = computed(() => dataTerfilter.value.length)

const rataRataHarga = computed(() =>
  totalKg.value > 0 ? totalPenjualan.value / totalKg.value : 0
)

const adaFilterTambahan = computed(() =>
  pencarian.value.trim() !== '' || jenisIkanDipilih.value !== '' || kolamDipilih.value !== ''
)

function resetFilterTambahan() {
  pencarian.value = ''
  jenisIkanDipilih.value = ''
  kolamDipilih.value = ''
}
</script>

<template>
  <div>
    <!-- Filter periode laporan -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <p class="text-[13px] text-ink-500 dark:text-ink-300">
        Riwayat penjualan tercatat otomatis dari transaksi
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="p in PRESET_PERIODE"
          :key="p.key"
          type="button"
          class="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold whitespace-nowrap"
          :class="periodeDipilih === p.key
            ? 'bg-brand-500 text-white'
            : 'bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 text-ink-600 dark:text-ink-300'"
          @click="periodeDipilih = p.key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Input rentang kustom, hanya muncul saat preset "Rentang Kustom" dipilih -->
    <div v-if="periodeDipilih === 'custom'" class="flex flex-wrap items-center gap-3 mb-4">
      <div>
        <label class="block text-[12px] text-ink-500 dark:text-ink-300 mb-1">Dari tanggal</label>
        <input
          v-model="tanggalMulaiCustom"
          type="date"
          class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
        />
      </div>
      <div>
        <label class="block text-[12px] text-ink-500 dark:text-ink-300 mb-1">Sampai tanggal</label>
        <input
          v-model="tanggalSelesaiCustom"
          type="date"
          class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
        />
      </div>
    </div>

    <!-- Search & filter tambahan -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari jenis ikan, kolam, atau catatan..."
          class="w-full pl-9 pr-3 py-2 text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg bg-white dark:bg-ink-900 dark:text-white placeholder:text-ink-400"
        />
      </div>

      <select
        v-model="jenisIkanDipilih"
        class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-2 bg-white dark:bg-ink-900 dark:text-white sm:w-48"
      >
        <option value="">Semua jenis ikan</option>
        <option v-for="j in daftarJenisIkan" :key="j" :value="j">{{ j }}</option>
      </select>

      <select
        v-model="kolamDipilih"
        class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-2 bg-white dark:bg-ink-900 dark:text-white sm:w-48"
      >
        <option value="">Semua kolam</option>
        <option v-for="k in daftarKolamFilter" :key="k" :value="k">{{ k }}</option>
      </select>

      <button
        v-if="adaFilterTambahan"
        type="button"
        class="px-3 py-2 text-[13px] font-medium text-ink-500 dark:text-ink-300 border border-ink-100 dark:border-ink-500 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-700 whitespace-nowrap"
        @click="resetFilterTambahan"
      >
        Reset filter
      </button>
    </div>

    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Penjualan</p>
        <p class="text-xl font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(totalPenjualan) }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Terjual</p>
        <p class="text-xl font-semibold dark:text-white">{{ totalKg }} kg</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Jumlah Transaksi</p>
        <p class="text-xl font-semibold dark:text-white">{{ jumlahTransaksi }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Rata-rata Harga/kg</p>
        <p class="text-xl font-semibold text-gold-500">{{ rupiah(rataRataHarga) }}</p>
      </div>
    </div>

    <!-- Tabel riwayat -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500">
        <h2 class="text-[13.5px] font-semibold dark:text-white">Riwayat Penjualan — {{ labelPeriode }}</h2>
      </div>

      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah (kg)</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Harga/kg</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Memuat data...</td>
          </tr>
          <tr v-else-if="dataTerfilter.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              {{ adaFilterTambahan ? 'Tidak ada data yang cocok dengan pencarian/filter.' : 'Belum ada penjualan pada periode ini.' }}
            </td>
          </tr>
          <tr v-for="p in dataTerfilter" :key="p.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3">{{ p.nama_ikan }}</td>
            <td class="px-4 py-3">{{ p.nama_kolam || '-' }}</td>
            <td class="px-4 py-3">{{ p.jumlah_kg }}</td>
            <td class="px-4 py-3">{{ rupiah(p.harga_per_kg) }}</td>
            <td class="px-4 py-3 font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(p.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
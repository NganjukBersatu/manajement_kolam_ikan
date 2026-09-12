<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const loading = ref(true)
const daftar = ref([])
const total = ref(0)

const sekarang = new Date()
const selectedMonth = ref(sekarang.getMonth() + 1)
const selectedYear = ref(sekarang.getFullYear())

// ===================== Search & Filter =====================
const pencarian = ref('')
const filterKategori = ref('') // '' = semua
const filterWaktu = ref('semua') // semua | hari_ini | kemarin | 7_hari | kustom
const tanggalMulai = ref('')
const tanggalAkhir = ref('')

const daftarBulan = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

const OPSI_WAKTU = [
  { value: 'semua', label: 'Semua waktu' },
  { value: 'hari_ini', label: 'Hari ini' },
  { value: 'kemarin', label: 'Kemarin' },
  { value: '7_hari', label: '7 hari terakhir' },
  { value: 'kustom', label: 'Rentang tanggal kustom' }
]

const namaPeriode = computed(() => {
  const bulan = daftarBulan.find(b => b.value === selectedMonth.value)?.label || ''
  return `${bulan} ${selectedYear.value}`
})

function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function ymd(d) {
  if (!d) return ''
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
}

function hitungRentangWaktu() {
  const sekarang = new Date()
  const hariIni = ymd(sekarang)

  switch (filterWaktu.value) {
    case 'hari_ini':
      return { dari: hariIni, sampai: hariIni }
    case 'kemarin': {
      const kemarin = new Date(sekarang)
      kemarin.setDate(kemarin.getDate() - 1)
      const s = ymd(kemarin)
      return { dari: s, sampai: s }
    }
    case '7_hari': {
      const awal = new Date(sekarang)
      awal.setDate(awal.getDate() - 6)
      return { dari: ymd(awal), sampai: hariIni }
    }
    case 'kustom':
      if (!tanggalMulai.value && !tanggalAkhir.value) return null
      return {
        dari: tanggalMulai.value || '0000-01-01',
        sampai: tanggalAkhir.value || '9999-12-31'
      }
    default:
      return null
  }
}

function cocokRentangTanggal(tgl) {
  const rentang = hitungRentangWaktu()
  if (!rentang) return true
  const t = ymd(tgl)
  return t >= rentang.dari && t <= rentang.sampai
}

function isGaji(item) {
  return (item.kategori || '').toLowerCase() === 'gaji'
}

async function muat() {
  loading.value = true
  try {
    // Ambil pengeluaran biasa
    const resPengeluaran = await fetch(
      `/api/pengeluaran?bulan=${selectedMonth.value}&tahun=${selectedYear.value}`
    )
    const jsonPengeluaran = await resPengeluaran.json()
    const dataPengeluaran = (jsonPengeluaran.data || []).map(item => ({
      ...item,
      kategori: item.kategori || 'Pengeluaran Lain',
      jumlah: Number(item.jumlah || 0)
    }))

    // Ambil pengeluaran pakan
    const resPakan = await fetch(
      `/api/pakan?bulan=${selectedMonth.value}&tahun=${selectedYear.value}`
    )
    const jsonPakan = await resPakan.json()
    const dataPakan = (jsonPakan.data || []).map(item => ({
      id: `pakan-${item.id}`,
      tanggal: item.tanggal,
      kategori: 'Pakan Harian',
      deskripsi: item.deskripsi || `Pakan ${item.jenis_pakan || ''}`.trim(),
      jumlah: Number(item.total || item.jumlah || item.biaya || 0)
    }))

    // Gabungkan & urutkan berdasarkan tanggal (terbaru di atas)
    daftar.value = [...dataPengeluaran, ...dataPakan].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    )

    total.value = daftar.value.reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
  } catch (err) {
    console.error(err)
    daftar.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// Data yang sudah difilter (search + kategori + rentang tanggal)
const daftarTerfilter = computed(() => {
  const kata = pencarian.value.trim().toLowerCase()

  return daftar.value.filter((p) => {
    const cocokKata =
      !kata ||
      (p.deskripsi || '').toLowerCase().includes(kata) ||
      (p.kategori || '').toLowerCase().includes(kata)

    const cocokKategori = !filterKategori.value || p.kategori === filterKategori.value

    return cocokKata && cocokKategori && cocokRentangTanggal(p.tanggal)
  })
})

// ========== PEMISAHAN UNTUK PERHITUNGAN WARALABA ==========
const totalGaji = computed(() =>
  daftarTerfilter.value
    .filter(item => isGaji(item))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
)

const totalOperasional = computed(() =>
  daftarTerfilter.value
    .filter(item => !isGaji(item))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
)

const totalTerfilter = computed(() => totalGaji.value + totalOperasional.value)

const jumlahTransaksiGaji = computed(() =>
  daftarTerfilter.value.filter(item => isGaji(item)).length
)

const jumlahTransaksiOperasional = computed(() =>
  daftarTerfilter.value.filter(item => !isGaji(item)).length
)

const adaFilterAktif = computed(() =>
  !!(pencarian.value || filterKategori.value || filterWaktu.value !== 'semua')
)

function resetFilter() {
  pencarian.value = ''
  filterKategori.value = ''
  filterWaktu.value = 'semua'
  tanggalMulai.value = ''
  tanggalAkhir.value = ''
}

watch([selectedMonth, selectedYear], () => {
  muat()
})

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Bulan & Tahun -->
    <div class="flex justify-end items-center gap-2">
      <select
        v-model="selectedMonth"
        class="rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
      >
        <option v-for="b in daftarBulan" :key="b.value" :value="b.value">
          {{ b.label }}
        </option>
      </select>

      <select
        v-model="selectedYear"
        class="rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
      >
        <option v-for="y in [2024, 2025, 2026, 2027, 2028]" :key="y" :value="y">
          {{ y }}
        </option>
      </select>
    </div>

    <!-- Search & Filter -->
    <div class="flex flex-col lg:flex-row gap-3">
      <div class="relative w-full lg:flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-300 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari deskripsi atau kategori..."
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white pl-10 pr-3 py-2.5 text-[13.5px]"
        />
      </div>

      <select
        v-model="filterKategori"
        class="w-full lg:w-48 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option value="">Semua kategori</option>
        <option value="Pakan Harian">Pakan Harian</option>
        <option value="obat">Obat</option>
        <option value="listrik">Listrik</option>
        <option value="gaji">Gaji</option>
        <option value="perlengkapan">Perlengkapan</option>
        <option value="lainnya">Lainnya</option>
        <option value="Pengeluaran Lain">Pengeluaran Lain</option>
      </select>

      <select
        v-model="filterWaktu"
        class="w-full lg:w-56 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option v-for="o in OPSI_WAKTU" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>

      <template v-if="filterWaktu === 'kustom'">
        <input
          v-model="tanggalMulai"
          type="date"
          class="w-full lg:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
        />
        <input
          v-model="tanggalAkhir"
          type="date"
          class="w-full lg:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
        />
      </template>

      <button
        v-if="adaFilterAktif"
        type="button"
        class="w-full lg:w-auto px-3 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 text-[13px] font-medium hover:bg-ink-50 dark:hover:bg-ink-600 shrink-0"
        @click="resetFilter"
      >
        Reset
      </button>
    </div>

    <!-- ===================== RINGKASAN UNTUK WARALABA ===================== -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total Operasional -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">
          Pengeluaran Operasional
          <span v-if="adaFilterAktif" class="text-ink-400 text-[11px]">(filter)</span>
        </p>
        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
          {{ rupiah(totalOperasional) }}
        </p>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mt-1">
          {{ jumlahTransaksiOperasional }} transaksi
        </p>
        <p class="text-[11px] text-ink-400 mt-2 leading-tight">
          Termasuk: Pakan, Obat, Listrik, Perlengkapan, dll
        </p>
      </div>

      <!-- Total Gaji -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">
          Pengeluaran Gaji
          <span v-if="adaFilterAktif" class="text-ink-400 text-[11px]">(filter)</span>
        </p>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
          {{ rupiah(totalGaji) }}
        </p>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mt-1">
          {{ jumlahTransaksiGaji }} transaksi
        </p>
        <p class="text-[11px] text-ink-400 mt-2 leading-tight">
          Khusus untuk perhitungan waralaba
        </p>
      </div>

      <!-- Total Keseluruhan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">
          Total Pengeluaran — {{ namaPeriode }}
          <span v-if="adaFilterAktif" class="text-ink-400 text-[11px]">(filter)</span>
        </p>
        <p class="text-2xl font-bold text-danger-600 dark:text-danger-500 mt-1">
          {{ rupiah(totalTerfilter) }}
        </p>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mt-1">
          {{ daftarTerfilter.length }} transaksi
          <span v-if="adaFilterAktif && daftar.length">
            dari {{ daftar.length }} total
          </span>
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-10 text-center">
      Memuat data...
    </div>

    <!-- Tabel Detail -->
    <div
      v-else
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kategori</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Deskripsi</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in daftarTerfilter"
            :key="p.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3">
              <span
                :class="isGaji(p)
                  ? 'inline-flex px-2 py-0.5 rounded-full text-[12px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'capitalize'"
              >
                {{ p.kategori }}
              </span>
            </td>
            <td class="px-4 py-3">{{ p.deskripsi || '-' }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ rupiah(p.jumlah) }}</td>
          </tr>

          <tr v-if="!daftar.length">
            <td colspan="4" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Belum ada pengeluaran di {{ namaPeriode }}
            </td>
          </tr>

          <tr v-else-if="!daftarTerfilter.length">
            <td colspan="4" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Tidak ada data yang cocok dengan pencarian/filter kamu.
            </td>
          </tr>
        </tbody>

        <tfoot v-if="daftarTerfilter.length">
          <tr class="border-t border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <td colspan="3" class="px-4 py-3 font-semibold text-right dark:text-white">
              Total Bersih
            </td>
            <td class="px-4 py-3 text-right font-bold text-danger-600 dark:text-danger-500">
              {{ rupiah(totalTerfilter) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
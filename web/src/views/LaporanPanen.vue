<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const loading = ref(true)
const daftarPanen = ref([])
const error = ref('')

const sekarang = new Date()
const selectedMonth = ref(sekarang.getMonth() + 1)
const selectedYear = ref(sekarang.getFullYear())

const pencarian = ref('')
const filterKolam = ref('')

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

const namaPeriode = computed(() => {
  const bulan = daftarBulan.find(b => b.value === selectedMonth.value)?.label || ''
  return `${bulan} ${selectedYear.value}`
})

function angka(n) {
  return Number(n || 0).toLocaleString('id-ID')
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

async function muat() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(
      `/api/panen?bulan=${selectedMonth.value}&tahun=${selectedYear.value}`
    )

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.message || 'Gagal memuat data panen')
    }

    const json = await res.json()
    daftarPanen.value = Array.isArray(json.data) ? json.data : []
  } catch (err) {
    console.error(err)
    error.value = err.message || 'Gagal memuat data panen'
    daftarPanen.value = []
  } finally {
    loading.value = false
  }
}

// Daftar kolam unik
const daftarKolam = computed(() => {
  const set = new Set()
  daftarPanen.value.forEach(p => {
    if (p.nama_kolam) set.add(p.nama_kolam)
  })
  return Array.from(set).sort()
})

// Filter pencarian + kolam
const daftarTerfilter = computed(() => {
  const kata = pencarian.value.trim().toLowerCase()
  const kolam = filterKolam.value

  return daftarPanen.value.filter(p => {
    const cocokKolam = !kolam || p.nama_kolam === kolam
    const teks = `${p.nama_kolam || ''} ${p.jenis_ikan || ''} ${p.catatan || ''}`.toLowerCase()
    const cocokKata = !kata || teks.includes(kata)
    return cocokKolam && cocokKata
  })
})

// Ringkasan
const totalEkor = computed(() =>
  daftarTerfilter.value.reduce((sum, p) => sum + Number(p.jumlah_ekor || 0), 0)
)

const totalKg = computed(() =>
  daftarTerfilter.value.reduce((sum, p) => sum + Number(p.berat_kg || 0), 0)
)

const jumlahTransaksi = computed(() => daftarTerfilter.value.length)

const adaFilterAktif = computed(() => !!(pencarian.value || filterKolam.value))

function resetFilter() {
  pencarian.value = ''
  filterKolam.value = ''
}

watch([selectedMonth, selectedYear], () => {
  muat()
})

onMounted(() => {
  muat()
})
</script>

<template>
  <div class="space-y-6">
  <!-- Header -->
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
  <div>
  </div>

  <div class="flex items-center gap-2">
    <select
      v-model.number="selectedMonth"
      class="rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
    >
      <option v-for="b in daftarBulan" :key="b.value" :value="b.value">
        {{ b.label }}
      </option>
    </select>

    <select
      v-model.number="selectedYear"
      class="rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
    >
      <option v-for="y in [2024, 2025, 2026, 2027, 2028]" :key="y" :value="y">
        {{ y }}
      </option>
    </select>
  </div>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari kolam, jenis ikan, atau catatan..."
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white pl-10 pr-3 py-2.5 text-[13.5px]"
        />
      </div>

      <select
        v-model="filterKolam"
        class="w-full lg:w-48 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option value="">Semua Kolam</option>
        <option v-for="k in daftarKolam" :key="k" :value="k">{{ k }}</option>
      </select>

      <button
        v-if="adaFilterAktif"
        type="button"
        class="w-full lg:w-auto px-3 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 text-[13px] font-medium hover:bg-ink-50 dark:hover:bg-ink-600 shrink-0"
        @click="resetFilter"
      >
        Reset
      </button>
    </div>

    <!-- Kartu Ringkasan -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total Panen (ekor)</p>
        <p class="text-xl font-bold dark:text-white mt-1">{{ angka(totalEkor) }}</p>
        <p class="text-[11.5px] text-ink-400 mt-1">{{ namaPeriode }}</p>
      </div>

      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total Berat</p>
        <p class="text-xl font-bold dark:text-white mt-1">
          {{ angka(totalKg) }}
          <span class="text-[13px] font-medium text-ink-500">kg</span>
        </p>
      </div>

      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Jumlah Transaksi</p>
        <p class="text-xl font-bold dark:text-white mt-1">{{ jumlahTransaksi }}</p>
        <p v-if="adaFilterAktif" class="text-[11.5px] text-ink-400 mt-1">hasil filter</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-[13.5px] text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-16 text-center">
      Memuat data panen...
    </div>

    <!-- Tabel -->
    <div
      v-else
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 flex items-center justify-between">
        <h3 class="text-[14px] font-semibold dark:text-white">
          Detail Hasil Panen — {{ namaPeriode }}
        </h3>
        <span class="text-[12px] text-ink-400">
          {{ daftarTerfilter.length }} data
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah (ekor)</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Berat (kg)</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="p in daftarTerfilter"
              :key="p.id"
              class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100 hover:bg-ink-50/30 dark:hover:bg-ink-900/20"
            >
              <td class="px-4 py-3 whitespace-nowrap">{{ tanggal(p.tanggal) }}</td>
              <td class="px-4 py-3 font-semibold">{{ p.nama_kolam || '-' }}</td>
              <td class="px-4 py-3">{{ p.jenis_ikan || '-' }}</td>
              <td class="px-4 py-3">{{ angka(p.jumlah_ekor) }}</td>
              <td class="px-4 py-3">{{ angka(p.berat_kg) }}</td>
              <td class="px-4 py-3 text-ink-500 dark:text-ink-400 text-[12.5px]">
                {{ p.catatan || '-' }}
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="!loading && daftarPanen.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-ink-400 dark:text-ink-300">
                Belum ada hasil panen di {{ namaPeriode }}
              </td>
            </tr>

            <tr v-else-if="!loading && daftarTerfilter.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-ink-400 dark:text-ink-300">
                Tidak ada data yang cocok dengan filter pencarian.
              </td>
            </tr>
          </tbody>

          <!-- Footer total -->
          <tfoot v-if="daftarTerfilter.length > 0">
            <tr class="border-t border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <td colspan="3" class="px-4 py-3 font-semibold text-right dark:text-white">
                Total
              </td>
              <td class="px-4 py-3 font-bold dark:text-white">{{ angka(totalEkor) }}</td>
              <td class="px-4 py-3 font-bold dark:text-white">{{ angka(totalKg) }} kg</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
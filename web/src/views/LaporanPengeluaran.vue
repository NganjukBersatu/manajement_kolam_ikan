<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const loading = ref(true)
const daftar = ref([])
const total = ref(0)

const sekarang = new Date()
const selectedMonth = ref(sekarang.getMonth() + 1)
const selectedYear = ref(sekarang.getFullYear())

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

    // Hitung total
    total.value = daftar.value.reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
  } catch (err) {
    console.error(err)
    daftar.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch([selectedMonth, selectedYear], () => {
  muat()
})

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-[18px] font-semibold dark:text-white">Laporan Pengeluaran</h1>
        <p class="text-[13.5px] text-ink-500 dark:text-ink-300">
          Detail & total pengeluaran (termasuk pakan) per bulan
        </p>
      </div>

      <!-- Filter Bulan & Tahun -->
      <div class="flex items-center gap-2">
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
    </div>

    <!-- Kartu Total -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <p class="text-[13px] text-ink-500 dark:text-ink-300">
        Total Pengeluaran — {{ namaPeriode }}
      </p>
      <p class="text-2xl font-bold text-danger-600 dark:text-danger-500 mt-1">
        {{ rupiah(total) }}
      </p>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mt-1">
        {{ daftar.length }} transaksi
      </p>
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
            v-for="p in daftar"
            :key="p.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3 capitalize">{{ p.kategori }}</td>
            <td class="px-4 py-3">{{ p.deskripsi || '-' }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ rupiah(p.jumlah) }}</td>
          </tr>
          <tr v-if="!daftar.length">
            <td colspan="4" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Belum ada pengeluaran di {{ namaPeriode }}
            </td>
          </tr>
        </tbody>

        <tfoot v-if="daftar.length">
          <tr class="border-t border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <td colspan="3" class="px-4 py-3 font-semibold text-right dark:text-white">
              Total Bersih
            </td>
            <td class="px-4 py-3 text-right font-bold text-danger-600 dark:text-danger-500">
              {{ rupiah(total) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
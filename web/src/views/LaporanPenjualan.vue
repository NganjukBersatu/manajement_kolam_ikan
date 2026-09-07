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

// Daftar bulan yang tersedia dari data (untuk dropdown filter)
const bulanTersedia = computed(() => {
  const set = new Set(daftar.value.map((p) => p.tanggal.slice(0, 7))) // 'YYYY-MM'
  const now = new Date()
  const bulanIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  set.add(bulanIni)
  return Array.from(set).sort().reverse()
})

const bulanDipilih = ref('')

onMounted(async () => {
  await muat()
  bulanDipilih.value = bulanTersedia.value[0]
})

function formatBulan(ym) {
  const [y, m] = ym.split('-')
  const nama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return `${nama[parseInt(m, 10) - 1]} ${y}`
}

function tanggal(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID')
}

// Data terfilter sesuai bulan yang dipilih
const dataTerfilter = computed(() => {
  if (!bulanDipilih.value) return []
  return daftar.value
    .filter((p) => p.tanggal.startsWith(bulanDipilih.value))
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
</script>

<template>
  <div>
    <!-- Filter bulan -->
    <div class="flex items-center justify-between mb-4">
      <p class="text-[13px] text-ink-500 dark:text-ink-300">
        Riwayat penjualan tercatat otomatis dari transaksi
      </p>
      <select
        v-model="bulanDipilih"
        class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
      >
        <option v-for="b in bulanTersedia" :key="b" :value="b">
          {{ formatBulan(b) }}
        </option>
      </select>
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
        <h2 class="text-[13.5px] font-semibold dark:text-white">Riwayat Penjualan — {{ bulanDipilih ? formatBulan(bulanDipilih) : '' }}</h2>
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
            <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Belum ada penjualan pada bulan ini.</td>
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
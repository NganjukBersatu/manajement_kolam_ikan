<script setup>
import { ref, computed, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)

const namaBulanIni = computed(() =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date())
)

const namaBulanLalu = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d)
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
    const res = await fetch('/api/laporan')
    const json = await res.json()
    data.value = json.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-[18px] font-semibold">Laporan Ringkasan</h1>
      <p class="text-[13.5px] text-ink-500">Periode: {{ namaBulanIni }}</p>
    </div>

    <div v-if="loading" class="text-[13.5px] text-ink-500 py-10 text-center">Memuat...</div>

    <template v-else-if="data">
      <!-- Kartu -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500">Total Penjualan</p>
          <p class="text-xl font-bold text-brand-600 mt-1">{{ rupiah(data.total_penjualan) }}</p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500">Total Pengeluaran</p>
          <p class="text-xl font-bold text-danger-600 mt-1">{{ rupiah(data.total_pengeluaran) }}</p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500">Keuntungan</p>
          <p class="text-xl font-bold mt-1" :class="data.keuntungan >= 0 ? 'text-brand-600' : 'text-danger-600'">
            {{ rupiah(data.keuntungan) }}
          </p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500">Total Panen</p>
          <p class="text-xl font-bold mt-1">{{ data.total_panen_ekor || 0 }} ekor</p>
          <p class="text-[12px] text-ink-500">{{ data.total_panen_kg || 0 }} kg</p>
        </div>
      </div>

      <!-- Perbandingan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-[14px]">Bulan Ini</h3>
            <span class="text-[12px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">{{ namaBulanIni }}</span>
          </div>
          <div class="space-y-3 text-[13.5px]">
            <div class="flex justify-between"><span class="text-ink-500">Panen (ekor)</span><span class="font-semibold">{{ data.total_panen_ekor || 0 }} ekor</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Panen (kg)</span><span class="font-semibold">{{ data.total_panen_kg || 0 }} kg</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Penjualan</span><span class="font-semibold text-brand-600">{{ rupiah(data.total_penjualan) }}</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Pengeluaran</span><span class="font-semibold text-danger-600">{{ rupiah(data.total_pengeluaran) }}</span></div>
            <div class="border-t border-ink-100 dark:border-ink-500 pt-3 flex justify-between">
              <span class="font-medium">Keuntungan</span>
              <span class="font-bold" :class="data.keuntungan >= 0 ? 'text-brand-600' : 'text-danger-600'">{{ rupiah(data.keuntungan) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-[14px]">Bulan Sebelumnya</h3>
            <span class="text-[12px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 font-medium">{{ namaBulanLalu }}</span>
          </div>
          <div class="space-y-3 text-[13.5px]">
            <div class="flex justify-between"><span class="text-ink-500">Panen (ekor)</span><span class="font-semibold">{{ data.bulan_lalu?.panen_ekor || 0 }} ekor</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Panen (kg)</span><span class="font-semibold">{{ data.bulan_lalu?.panen_kg || 0 }} kg</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Penjualan</span><span class="font-semibold text-brand-600">{{ rupiah(data.bulan_lalu?.penjualan) }}</span></div>
            <div class="flex justify-between"><span class="text-ink-500">Pengeluaran</span><span class="font-semibold text-danger-600">{{ rupiah(data.bulan_lalu?.pengeluaran) }}</span></div>
            <div class="border-t border-ink-100 dark:border-ink-500 pt-3 flex justify-between">
              <span class="font-medium">Keuntungan</span>
              <span class="font-bold" :class="(data.bulan_lalu?.keuntungan || 0) >= 0 ? 'text-brand-600' : 'text-danger-600'">{{ rupiah(data.bulan_lalu?.keuntungan) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stok Kolam -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
        <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 font-semibold text-[14px]">Stok Ikan per Kolam</div>
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3">Kolam</th>
              <th class="px-4 py-3">Jenis Ikan</th>
              <th class="px-4 py-3">Bibit Awal</th>
              <th class="px-4 py-3">Bibit Akhir</th>
              <th class="px-4 py-3">Tgl Tebar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in data.per_kolam" :key="k.nama_kolam" class="border-b border-ink-100 dark:border-ink-500 last:border-0">
              <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
              <td class="px-4 py-3">{{ k.jenis_ikan || '-' }}</td>
              <td class="px-4 py-3">{{ k.jumlah_bibit?.toLocaleString('id-ID') || '-' }}</td>
              <td class="px-4 py-3">{{ k.jumlah_saat_ini?.toLocaleString('id-ID') || '-' }}</td>
              <td class="px-4 py-3">{{ tanggal(k.tanggal_tebar) }}</td>
            </tr>
            <tr v-if="!data.per_kolam?.length">
              <td colspan="5" class="px-4 py-8 text-center text-ink-400">Belum ada data stok kolam</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
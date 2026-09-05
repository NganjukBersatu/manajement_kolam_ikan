<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const data = ref(null)

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }

async function muat() {
  loading.value = true
  const res = await fetch('/api/dashboard')
  data.value = await res.json()
  loading.value = false
}
onMounted(muat)
</script>

<template>
  <div v-if="loading">Memuat...</div>
  <div v-else class="space-y-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[13px] text-ink-500">Total Kolam</p>
        <p class="text-2xl font-bold">{{ data.statistik.totalKolam }}</p>
        <p class="text-[12.5px] text-ink-500">{{ data.statistik.kolamAktif }} aktif · {{ data.statistik.kolamKosong }} kosong</p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[13px] text-ink-500">Total Ikan Hidup</p>
        <p class="text-2xl font-bold">{{ data.statistik.totalIkanHidup }} ekor</p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[13px] text-ink-500">Penjualan Bulan Ini</p>
        <p class="text-2xl font-bold text-brand-600">{{ rupiah(data.statistik.penjualanBulanIni) }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[13px] text-ink-500">Keuntungan Bulan Ini</p>
        <p class="text-2xl font-bold" :class="data.statistik.keuntunganBulanIni >= 0 ? 'text-brand-600' : 'text-danger-600'">
          {{ rupiah(data.statistik.keuntunganBulanIni) }}
        </p>
      </div>
    </div>

    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold mb-3">Jadwal Mendatang</h2>
      <p v-if="data.jadwalMendatang.length === 0" class="text-[13px] text-ink-500">Tidak ada jadwal mendatang.</p>
      <ul v-else class="space-y-2">
        <li v-for="j in data.jadwalMendatang" :key="j.id" class="flex justify-between text-[13.5px] border-b border-ink-100 dark:border-ink-500 pb-2 last:border-0">
          <span>
            <span class="font-semibold capitalize">{{ j.jenis }}</span> —
            {{ j.nama_kolam }} ({{ j.nama_ikan }})
          </span>
          <span class="text-ink-500">{{ tanggal(j.tanggal_jadwal) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
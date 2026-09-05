<script setup>
import { ref, onMounted, computed } from 'vue'

const loading = ref(true)
const data = ref(null)

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }

// Kelas badge per jenis jadwal — ditulis literal (bukan dibangun dinamis)
// supaya Tailwind tetap mendeteksinya saat build.
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

async function muat() {
  loading.value = true
  const res = await fetch('/api/dashboard')
  data.value = await res.json()
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

      <!-- Kartu ringkas: kolom -->
      <div class="flex flex-col gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4 flex-1 flex flex-col justify-center">
          <p class="text-[13px] text-ink-500 dark:text-ink-300">Penjualan bulan ini</p>
          <p class="text-xl font-bold text-gold-600 dark:text-gold-400 mt-1">{{ rupiah(data.statistik.penjualanBulanIni) }}</p>
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

    <!-- Jadwal Mendatang -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold dark:text-white mb-3">Jadwal mendatang</h2>

      <div v-if="data.jadwalMendatang.length === 0" class="flex items-center gap-4 py-2">
        <div class="w-11 h-11 rounded-card bg-gold-100 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" class="text-gold-600">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </div>
        <div>
          <p class="text-[13.5px] font-semibold dark:text-white">Belum ada jadwal mendatang</p>
          <p class="text-[13px] text-ink-500 dark:text-ink-300">Buat jadwal pemberian pakan atau panen supaya tidak ada kolam yang terlewat.</p>
        </div>
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="j in data.jadwalMendatang"
          :key="j.id"
          class="flex items-center justify-between text-[13.5px] border-b border-ink-100 dark:border-ink-500 pb-2 last:border-0"
        >
          <span class="flex items-center gap-2 dark:text-ink-100">
            <span class="px-2 py-0.5 rounded-full text-[11.5px] font-semibold capitalize" :class="kelasBadge(j.jenis)">
              {{ j.jenis }}
            </span>
            <span>{{ j.nama_kolam }} <span class="text-ink-500 dark:text-ink-300">({{ j.nama_ikan }})</span></span>
          </span>
          <span class="text-ink-500 dark:text-ink-300">{{ tanggal(j.tanggal_jadwal) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const data = ref(null)
const loading = ref(true)

const riwayatPakan = ref([])
const riwayatObat = ref([])

const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const now = new Date()
const bulanDipilih = ref(now.getMonth() + 1) // 1-12
const tahunDipilih = ref(now.getFullYear())

// Daftar tahun untuk dropdown: 3 tahun ke belakang s/d tahun berjalan
const tahunTersedia = computed(() => {
  const arr = []
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) arr.push(y)
  return arr
})

const namaBulanDipilih = computed(() => `${namaBulan[bulanDipilih.value - 1]} ${tahunDipilih.value}`)

const namaBulanSebelumnya = computed(() => {
  const d = new Date(tahunDipilih.value, bulanDipilih.value - 1, 1)
  d.setMonth(d.getMonth() - 1)
  return `${namaBulan[d.getMonth()]} ${d.getFullYear()}`
})

// Riwayat pakan/obat difilter sesuai bulan & tahun yang sedang dipilih
const riwayatPakanPeriode = computed(() =>
  riwayatPakan.value.filter(r => {
    const t = new Date(r.tanggal)
    return t.getMonth() + 1 === bulanDipilih.value && t.getFullYear() === tahunDipilih.value
  })
)

const riwayatObatPeriode = computed(() =>
  riwayatObat.value.filter(r => {
    const t = new Date(r.tanggal)
    return t.getMonth() + 1 === bulanDipilih.value && t.getFullYear() === tahunDipilih.value
  })
)

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
    const res = await fetch(`/api/laporan?bulan=${bulanDipilih.value}&tahun=${tahunDipilih.value}`)
    const json = await res.json()
    data.value = json.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function muatRiwayatPakanObat() {
  try {
    const [resPakan, resObat] = await Promise.all([
      fetch('/api/pakan'),
      fetch('/api/obat')
    ])
    riwayatPakan.value = (await resPakan.json()).data
    riwayatObat.value = (await resObat.json()).data
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  muat()
  muatRiwayatPakanObat()
})
watch([bulanDipilih, tahunDipilih], muat)
</script>

<template>
  <div class="space-y-6">
    <!-- Filter Bulan & Tahun -->
    <div class="flex items-center justify-between">
      <p class="text-[13px] text-ink-500 dark:text-ink-300">Pilih periode untuk melihat laporan bulan sebelumnya</p>
      <div class="flex items-center gap-2">
        <select
          v-model.number="bulanDipilih"
          class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
        >
          <option v-for="(b, i) in namaBulan" :key="b" :value="i + 1">{{ b }}</option>
        </select>
        <select
          v-model.number="tahunDipilih"
          class="text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
        >
          <option v-for="y in tahunTersedia" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-10 text-center">Memuat...</div>

    <template v-else-if="data">
      <!-- Kartu -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total Penjualan</p>
          <p class="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">{{ rupiah(data.total_penjualan) }}</p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total Pengeluaran</p>
          <p class="text-xl font-bold text-danger-600 dark:text-danger-500 mt-1">{{ rupiah(data.total_pengeluaran) }}</p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Keuntungan</p>
          <p class="text-xl font-bold mt-1" :class="data.keuntungan >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-600 dark:text-danger-500'">
            {{ rupiah(data.keuntungan) }}
          </p>
        </div>
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
          <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total Panen</p>
          <p class="text-xl font-bold dark:text-white mt-1">{{ data.total_panen_ekor || 0 }} ekor</p>
          <p class="text-[12px] text-ink-500 dark:text-ink-300">{{ data.total_panen_kg || 0 }} kg</p>
        </div>
      </div>

      <!-- Perbandingan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-[14px] dark:text-white">Periode Dipilih</h3>
            <span class="text-[12px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-600/25 dark:text-brand-100 font-medium">{{ namaBulanDipilih }}</span>
          </div>
          <div class="space-y-3 text-[13.5px]">
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Panen (ekor)</span><span class="font-semibold dark:text-ink-100">{{ data.total_panen_ekor || 0 }} ekor</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Panen (kg)</span><span class="font-semibold dark:text-ink-100">{{ data.total_panen_kg || 0 }} kg</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Penjualan</span><span class="font-semibold text-brand-600 dark:text-brand-400">{{ rupiah(data.total_penjualan) }}</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Pengeluaran</span><span class="font-semibold text-danger-600 dark:text-danger-500">{{ rupiah(data.total_pengeluaran) }}</span></div>
            <div class="border-t border-ink-100 dark:border-ink-500 pt-3 flex justify-between">
              <span class="font-medium dark:text-white">Keuntungan</span>
              <span class="font-bold" :class="data.keuntungan >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-600 dark:text-danger-500'">{{ rupiah(data.keuntungan) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-[14px] dark:text-white">Bulan Sebelumnya</h3>
            <span class="text-[12px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 dark:bg-ink-500/40 dark:text-ink-200 font-medium">{{ namaBulanSebelumnya }}</span>
          </div>
          <div class="space-y-3 text-[13.5px]">
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Panen (ekor)</span><span class="font-semibold dark:text-ink-100">{{ data.bulan_lalu?.panen_ekor || 0 }} ekor</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Panen (kg)</span><span class="font-semibold dark:text-ink-100">{{ data.bulan_lalu?.panen_kg || 0 }} kg</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Penjualan</span><span class="font-semibold text-brand-600 dark:text-brand-400">{{ rupiah(data.bulan_lalu?.penjualan) }}</span></div>
            <div class="flex justify-between"><span class="text-ink-500 dark:text-ink-300">Pengeluaran</span><span class="font-semibold text-danger-600 dark:text-danger-500">{{ rupiah(data.bulan_lalu?.pengeluaran) }}</span></div>
            <div class="border-t border-ink-100 dark:border-ink-500 pt-3 flex justify-between">
              <span class="font-medium dark:text-white">Keuntungan</span>
              <span class="font-bold" :class="(data.bulan_lalu?.keuntungan || 0) >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger-600 dark:text-danger-500'">{{ rupiah(data.bulan_lalu?.keuntungan) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stok Kolam -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
        <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 font-semibold text-[14px] dark:text-white">Stok Ikan per Kolam</div>
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Bibit Awal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Bibit Akhir</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Tebar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in data.per_kolam" :key="k.nama_kolam" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
              <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
              <td class="px-4 py-3">{{ k.jenis_ikan || '-' }}</td>
              <td class="px-4 py-3">{{ k.jumlah_bibit?.toLocaleString('id-ID') || '-' }}</td>
              <td class="px-4 py-3">{{ k.jumlah_saat_ini?.toLocaleString('id-ID') || '-' }}</td>
              <td class="px-4 py-3">{{ tanggal(k.tanggal_tebar) }}</td>
            </tr>
            <tr v-if="!data.per_kolam?.length">
              <td colspan="5" class="px-4 py-8 text-center text-ink-400 dark:text-ink-300">Belum ada data stok kolam</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Riwayat Pemberian Makan -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
        <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 flex items-center justify-between">
          <span class="font-semibold text-[14px] dark:text-white">Riwayat Pemberian Makan</span>
          <span class="text-[12px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-600/25 dark:text-brand-100 font-medium">{{ namaBulanDipilih }}</span>
        </div>
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah (kg)</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Biaya</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in riwayatPakanPeriode" :key="r.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
              <td class="px-4 py-3 font-semibold">{{ r.nama_kolam }}</td>
              <td class="px-4 py-3">{{ tanggal(r.tanggal) }}</td>
              <td class="px-4 py-3">{{ r.jumlah_kg }}</td>
              <td class="px-4 py-3">{{ rupiah(r.biaya) }}</td>
              <td class="px-4 py-3">{{ r.catatan || '-' }}</td>
            </tr>
            <tr v-if="riwayatPakanPeriode.length === 0">
              <td colspan="5" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
                Belum ada riwayat pemberian makan di periode ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Riwayat Pemberian Obat -->
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
        <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 flex items-center justify-between">
          <span class="font-semibold text-[14px] dark:text-white">Riwayat Pemberian Obat</span>
          <span class="text-[12px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-600/25 dark:text-brand-100 font-medium">{{ namaBulanDipilih }}</span>
        </div>
        <table class="w-full text-left text-[13.5px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Nama Obat</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Dosis</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Biaya</th>
              <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in riwayatObatPeriode" :key="r.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
              <td class="px-4 py-3 font-semibold">{{ r.nama_kolam }}</td>
              <td class="px-4 py-3">{{ tanggal(r.tanggal) }}</td>
              <td class="px-4 py-3">{{ r.nama_obat }}</td>
              <td class="px-4 py-3">{{ r.dosis || '-' }}</td>
              <td class="px-4 py-3">{{ rupiah(r.biaya) }}</td>
              <td class="px-4 py-3">{{ r.catatan || '-' }}</td>
            </tr>
            <tr v-if="riwayatObatPeriode.length === 0">
              <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
                Belum ada riwayat pemberian obat di periode ini.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'

const daftar = ref([])
const daftarJenisIkan = ref([])
const daftarKolam = ref([])
const loading = ref(true)
const showForm = ref(false)
const menyimpan = ref(false)

const kosongForm = () => ({
  tanggal: new Date().toISOString().slice(0, 10),
  jenis_ikan_id: '',
  kolam_id: '',
  jumlah_kg: '',
  harga_per_kg: '',
  catatan: ''
})
const form = ref(kosongForm())

const pencarian = ref('')

async function muat() {
  loading.value = true
  const [pj, ji, km] = await Promise.all([
    fetch('/api/penjualan').then(r => r.json()),
    fetch('/api/jenis-ikan').then(r => r.json()),
    fetch('/api/kolam').then(r => r.json())
  ])
  daftar.value = pj.data
  daftarJenisIkan.value = ji.data
  daftarKolam.value = km.data
  loading.value = false
}

// Preview total otomatis di form, dihitung langsung dari jumlah × harga sebelum disimpan
const totalPreview = computed(() => {
  const jumlah = Number(form.value.jumlah_kg) || 0
  const harga = Number(form.value.harga_per_kg) || 0
  return jumlah * harga
})

async function simpan() {
  menyimpan.value = true
  try {
    const res = await fetch('/api/penjualan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.message || 'Gagal menyimpan transaksi')
      return
    }
    showForm.value = false
    form.value = kosongForm()
    await muat()
  } finally {
    menyimpan.value = false
  }
}

async function hapus(id) {
  if (!confirm('Hapus transaksi ini?')) return
  const res = await fetch(`/api/penjualan/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus transaksi')
    return
  }
  await muat()
}

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

// Data terfilter berdasarkan pencarian, diurutkan dari transaksi terbaru
const dataTerfilter = computed(() => {
  const kataKunci = pencarian.value.trim().toLowerCase()
  return [...daftar.value]
    .filter((p) => {
      if (!kataKunci) return true
      const gabungan = `${p.nama_ikan || ''} ${p.nama_kolam || ''} ${p.catatan || ''}`.toLowerCase()
      return gabungan.includes(kataKunci)
    })
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})

const totalPendapatan = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.total), 0)
)
const totalKg = computed(() =>
  dataTerfilter.value.reduce((sum, p) => sum + Number(p.jumlah_kg), 0)
)
const jumlahTransaksi = computed(() => dataTerfilter.value.length)

onMounted(muat)
</script>

<template>
  <div>
    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Pendapatan</p>
        <p class="text-xl font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(totalPendapatan) }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Terjual</p>
        <p class="text-xl font-semibold dark:text-white">{{ totalKg }} kg</p>
      </div>
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Jumlah Transaksi</p>
        <p class="text-xl font-semibold dark:text-white">{{ jumlahTransaksi }}</p>
      </div>
    </div>

    <!-- Search & aksi -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
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
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 whitespace-nowrap"
        @click="showForm = true"
      >
        + Tambah Penjualan
      </button>
    </div>

    <!-- Tabel transaksi -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah (kg)</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Harga/kg</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Total</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">Memuat data...</td>
          </tr>
          <tr v-else-if="dataTerfilter.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              {{ pencarian ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi penjualan.' }}
            </td>
          </tr>
          <tr v-for="p in dataTerfilter" :key="p.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3">{{ p.nama_ikan }}</td>
            <td class="px-4 py-3">{{ p.nama_kolam || '-' }}</td>
            <td class="px-4 py-3">{{ p.jumlah_kg }}</td>
            <td class="px-4 py-3">{{ rupiah(p.harga_per_kg) }}</td>
            <td class="px-4 py-3 font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(p.total) }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-ink-300">{{ p.catatan || '-' }}</td>
            <td class="px-4 py-3 text-right">
              <button type="button" class="text-danger-600 dark:text-danger-500 text-[12.5px] font-semibold hover:underline" @click="hapus(p.id)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah Penjualan -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Penjualan</h2>
        <form class="space-y-3" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis Ikan</label>
            <select v-model="form.jenis_ikan_id" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="" disabled>Pilih jenis ikan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
            <p v-if="daftarJenisIkan.length === 0" class="text-[12px] text-warn-600 mt-1">
              Belum ada jenis ikan terdaftar.
            </p>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam (opsional)</label>
            <select v-model="form.kolam_id" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white">
              <option value="">Tidak diketahui</option>
              <option v-for="k in daftarKolam" :key="k.id" :value="k.id">{{ k.nama_kolam }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah (kg)</label>
              <input v-model="form.jumlah_kg" type="number" step="0.1" min="0" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Harga/kg</label>
              <input v-model="form.harga_per_kg" type="number" min="0" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
            </div>
          </div>

          <!-- Preview total otomatis -->
          <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-ink-50 dark:bg-ink-900 border border-ink-100 dark:border-ink-500">
            <span class="text-[13px] text-ink-500 dark:text-ink-300">Total</span>
            <span class="text-[15px] font-semibold text-brand-500 dark:text-brand-400">{{ rupiah(totalPreview) }}</span>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea
              v-model="form.catatan"
              rows="2"
              placeholder="Contoh: dijual ke pengepul Pak Slamet"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
            <button
              type="submit"
              :disabled="menyimpan"
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
            >
              {{ menyimpan ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
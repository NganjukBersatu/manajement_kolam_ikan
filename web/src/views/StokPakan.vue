<script setup>
import { ref, computed, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')
const daftarStok = ref([])
const showForm = ref(false)

const form = ref({
  nama: '',
  stok_awal: '',
  satuan: 'kg',
  stok_minimum: '10'
})

// Helper: parse angka aman untuk ditampilkan (defense in depth di UI)
function angka(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function muat() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/stok-pakan')
    if (!res.ok) throw new Error('Gagal memuat data stok pakan')
    const json = await res.json()
    daftarStok.value = json.data || []
  } catch (e) {
    error.value = e.message || 'Gagal memuat data stok pakan'
    daftarStok.value = []
  } finally {
    loading.value = false
  }
}

async function simpan() {
  const payload = {
    nama: form.value.nama,
    stok: Number(form.value.stok_awal) || 0,
    satuan: form.value.satuan || 'kg',
    stok_minimum: Number(form.value.stok_minimum) || 0
  }

  const res = await fetch('/api/stok-pakan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan jenis pakan')
    return
  }

  showForm.value = false
  form.value = { nama: '', stok_awal: '', satuan: 'kg', stok_minimum: '10' }
  await muat()
}

async function hapus(id) {
  if (!confirm('Yakin ingin menghapus jenis pakan ini?')) return
  const res = await fetch(`/api/stok-pakan/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus')
    return
  }
  await muat()
}

const totalJenis = computed(() => daftarStok.value.length)
const stokMenipis = computed(() =>
  daftarStok.value.filter(s => angka(s.stok) <= angka(s.stok_minimum)).length
)

// Total stok dikelompokkan per satuan, karena kg/sak/liter tidak boleh dijumlah jadi satu angka.
// Hasilnya array of { satuan, total }, misalnya [{ satuan: 'kg', total: 138 }, { satuan: 'sak', total: 5 }]
const totalStokPerSatuan = computed(() => {
  const kelompok = {}
  for (const s of daftarStok.value) {
    const satuan = s.satuan || 'kg'
    kelompok[satuan] = (kelompok[satuan] || 0) + angka(s.stok)
  }
  return Object.entries(kelompok).map(([satuan, total]) => ({ satuan, total }))
})

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-[18px] font-semibold dark:text-white">Stok Pakan</h1>
        <p class="text-[13.5px] text-ink-500 dark:text-ink-300">
          Daftar jenis pakan & sisa stok. Stok berkurang otomatis saat catat Pakan Harian di Pengeluaran.
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="showForm = true"
      >
        + Tambah jenis pakan
      </button>
    </div>

    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">Jenis pakan terdaftar</p>
        <p class="text-2xl font-bold dark:text-white mt-1">{{ totalJenis }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">Stok menipis</p>
        <p class="text-2xl font-bold mt-1" :class="stokMenipis > 0 ? 'text-danger-600' : 'dark:text-white'">
          {{ stokMenipis }}
        </p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
        <p class="text-[13px] text-ink-500 dark:text-ink-300">Total stok</p>
        <div v-if="totalStokPerSatuan.length" class="mt-1 space-y-0.5">
          <p
            v-for="t in totalStokPerSatuan"
            :key="t.satuan"
            class="text-2xl font-bold dark:text-white"
          >
            {{ t.total.toLocaleString('id-ID') }}
            <span class="text-[13px] font-medium text-ink-500 dark:text-ink-300">{{ t.satuan }}</span>
          </p>
        </div>
        <p v-else class="text-2xl font-bold dark:text-white mt-1">0</p>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-[13.5px] text-danger-600">{{ error }}</p>

    <!-- Loading -->
    <div v-if="loading" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-10 text-center">
      Memuat data...
    </div>

    <!-- Daftar jenis pakan -->
    <div
      v-else
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500">
        <h2 class="text-[14.5px] font-semibold dark:text-white">Daftar jenis pakan</h2>
      </div>

      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Nama pakan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Sisa stok</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Stok minimum</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in daftarStok"
            :key="s.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3 font-medium">{{ s.nama }}</td>
            <td class="px-4 py-3">
              {{ angka(s.stok).toLocaleString('id-ID') }} {{ s.satuan || 'kg' }}
            </td>
            <td class="px-4 py-3">
              {{ angka(s.stok_minimum).toLocaleString('id-ID') }} {{ s.satuan || 'kg' }}
            </td>
            <td class="px-4 py-3">
              <span
                v-if="angka(s.stok) <= angka(s.stok_minimum)"
                class="inline-flex px-2 py-0.5 rounded-full text-[12px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              >
                Menipis
              </span>
              <span
                v-else
                class="inline-flex px-2 py-0.5 rounded-full text-[12px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              >
                Aman
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12.5px] font-semibold hover:bg-red-600"
                @click="hapus(s.id)"
              >
                Hapus
              </button>
            </td>
          </tr>
          <tr v-if="!daftarStok.length">
            <td colspan="5" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Belum ada jenis pakan. Klik "Tambah jenis pakan" untuk mulai.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal tambah jenis pakan -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah jenis pakan</h2>
        <form class="space-y-3" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama pakan</label>
            <input
              v-model="form.nama"
              type="text"
              required
              placeholder="Contoh: Pelet 2mm"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Stok awal</label>
              <input
                v-model="form.stok_awal"
                type="number"
                min="0"
                step="0.1"
                required
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Satuan</label>
              <select
                v-model="form.satuan"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              >
                <option value="kg">kg</option>
                <option value="sak">sak</option>
                <option value="liter">liter</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Stok minimum (peringatan)</label>
            <input
              v-model="form.stok_minimum"
              type="number"
              min="0"
              step="0.1"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold"
              @click="showForm = false"
            >
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
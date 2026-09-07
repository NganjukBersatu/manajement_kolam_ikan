<script setup>
import { ref, onMounted } from 'vue'

const daftarKolam = ref([])
const daftarJenisIkan = ref([])
const showTebarForm = ref(false)
const showTambahKolam = ref(false)
const showEditKolam = ref(false)
const kolamDipilih = ref(null)
const kolamDiedit = ref(null)

const form = ref({ jenis_ikan_id: '', tanggal_tebar: '', jumlah_bibit: '' })
const formKolam = ref({ nama_kolam: '', luas_m2: '' })
const formEditKolam = ref({ nama_kolam: '', luas_m2: '' })

async function muatKolam() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  daftarKolam.value = json.data
}

async function muatJenisIkan() {
  const res = await fetch('/api/jenis-ikan')
  const json = await res.json()
  daftarJenisIkan.value = json.data
}

function bukaTebar(kolam) {
  kolamDipilih.value = kolam
  form.value = { jenis_ikan_id: '', tanggal_tebar: '', jumlah_bibit: '' }
  showTebarForm.value = true
}

function bukaTambahKolam() {
  formKolam.value = { nama_kolam: '', luas_m2: '' }
  showTambahKolam.value = true
}

function bukaEditKolam(kolam) {
  kolamDiedit.value = kolam
  formEditKolam.value = {
    nama_kolam: kolam.nama_kolam,
    luas_m2: kolam.luas_m2 || ''
  }
  showEditKolam.value = true
}

async function simpanTebar() {
  const res = await fetch('/api/tebar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kolam_id: kolamDipilih.value.id,
      ...form.value
    })
  })

  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan tebar')
    return
  }

  showTebarForm.value = false
  await muatKolam()
}

async function simpanKolam() {
  const payload = {
    nama_kolam: formKolam.value.nama_kolam,
    luas_m2: formKolam.value.luas_m2 ? Number(formKolam.value.luas_m2) : null
  }

  const res = await fetch('/api/kolam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menambah kolam')
    return
  }

  showTambahKolam.value = false
  await muatKolam()
}

async function simpanEditKolam() {
  const payload = {
    nama_kolam: formEditKolam.value.nama_kolam,
    luas_m2: formEditKolam.value.luas_m2 ? Number(formEditKolam.value.luas_m2) : null
  }

  const res = await fetch(`/api/kolam/${kolamDiedit.value.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal mengubah kolam')
    return
  }

  showEditKolam.value = false
  await muatKolam()
}

async function hapusKolam(kolam) {
  const konfirmasi = confirm(`Yakin ingin menghapus kolam "${kolam.nama_kolam}"? Data ini tidak bisa dikembalikan.`)
  if (!konfirmasi) return

  const res = await fetch(`/api/kolam/${kolam.id}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus kolam')
    return
  }

  await muatKolam()
}

function rupiah(n) {
  return n ? Number(n).toLocaleString('id-ID') : '-'
}

onMounted(() => {
  muatKolam()
  muatJenisIkan()
})
</script>

<template>
  <div>
    <!-- Header + Tombol Tambah -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-[18px] font-semibold dark:text-white">Daftar Kolam</h1>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="bukaTambahKolam"
      >
        + Tambah Kolam
      </button>
    </div>

    <!-- Tabel Kolam -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Luas (m²)</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Tebar</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Bibit</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="k in daftarKolam"
            :key="k.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
            <td class="px-4 py-3">{{ k.luas_m2 ? Number(k.luas_m2).toLocaleString('id-ID') : '-' }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-[11.5px] font-semibold"
                :class="k.status === 'aktif'
                  ? 'bg-ok-100 text-ok-600 dark:bg-ok-600/25 dark:text-ok-500'
                  : 'bg-ink-100 text-ink-500 dark:bg-ink-500/40 dark:text-ink-200'"
              >
                {{ k.status === 'aktif' ? 'Aktif' : 'Kosong' }}
              </span>
            </td>
            <td class="px-4 py-3">{{ k.nama_ikan || '-' }}</td>
            <td class="px-4 py-3">
              {{ k.tanggal_tebar ? new Date(k.tanggal_tebar).toLocaleDateString('id-ID') : '-' }}
            </td>
            <td class="px-4 py-3">{{ rupiah(k.jumlah_bibit) }}</td>
            <td class="px-4 py-3">{{ rupiah(k.jumlah_saat_ini) }}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 text-[12.5px] font-semibold hover:bg-ink-50 dark:hover:bg-ink-600"
                @click="bukaEditKolam(k)"
              >
                Edit
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 text-[12.5px] font-semibold hover:bg-red-50 dark:hover:bg-red-500/10"
                @click="hapusKolam(k)"
              >
                Hapus
              </button>
              <button
                v-if="k.status !== 'aktif'"
                type="button"
                class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600"
                @click="bukaTebar(k)"
              >
                Tebar Bibit
              </button>
            </td>
          </tr>
          <tr v-if="daftarKolam.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              Belum ada kolam. Tambahkan kolam pertamamu untuk mulai mencatat.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tebar Bibit -->
    <div v-if="showTebarForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showTebarForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">
          Tebar Bibit — {{ kolamDipilih?.nama_kolam }}
        </h2>
        <form class="space-y-3" @submit.prevent="simpanTebar">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis Ikan</label>
            <select
              v-model="form.jenis_ikan_id"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            >
              <option value="" disabled>Pilih jenis ikan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">
                {{ ji.nama }} (sortir {{ ji.hari_sortir }} hari, panen {{ ji.hari_panen }} hari)
              </option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal Tebar</label>
            <input
              v-model="form.tanggal_tebar"
              type="date"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah Bibit</label>
            <input
              v-model="form.jumlah_bibit"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold"
              @click="showTebarForm = false"
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

    <!-- Modal Tambah Kolam -->
    <div v-if="showTambahKolam" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showTambahKolam = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Kolam Baru</h2>
        <form class="space-y-3" @submit.prevent="simpanKolam">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Kolam</label>
            <input
              v-model="formKolam.nama_kolam"
              type="text"
              required
              placeholder="Contoh: Kolam A1"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">
              Luas (m²) <span class="text-ink-400 dark:text-ink-400 font-normal">(opsional)</span>
            </label>
            <input
              v-model="formKolam.luas_m2"
              type="number"
              min="0"
              step="0.01"
              placeholder="Contoh: 50"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold"
              @click="showTambahKolam = false"
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

    <!-- Modal Edit Kolam -->
    <div v-if="showEditKolam" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showEditKolam = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">Edit Kolam</h2>
        <form class="space-y-3" @submit.prevent="simpanEditKolam">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Kolam</label>
            <input
              v-model="formEditKolam.nama_kolam"
              type="text"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">
              Luas (m²) <span class="text-ink-400 dark:text-ink-400 font-normal">(opsional)</span>
            </label>
            <input
              v-model="formEditKolam.luas_m2"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold"
              @click="showEditKolam = false"
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
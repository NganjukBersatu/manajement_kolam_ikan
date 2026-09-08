<script setup>
import { ref, computed, onMounted } from 'vue'

const daftarKolam = ref([])
const pencarian = ref('')
const filterJenis = ref('')
const filterStatus = ref('')
// Catatan: nama variabel & fungsi fetch tetap "JenisIkan"/"jenis-ikan" supaya endpoint
// backend yang sudah ada tidak perlu diganti dulu. Tapi label yang tampil ke user
// sudah digenerikkan jadi "Jenis" (bukan "Jenis Ikan"), karena bisa berisi jenis
// ikan, udang, kepiting, dll. Kalau backend-nya juga mau diganti generik,
// tinggal ganti endpoint '/api/jenis-ikan' -> '/api/jenis' di muatJenisIkan().
const daftarJenisIkan = ref([])

const showTebarForm = ref(false)
const showTambahKolam = ref(false)
const showEditKolam = ref(false)
const kolamDipilih = ref(null)
const kolamDiedit = ref(null)

const form = ref({ jenis_ikan_id: '', tanggal_tebar: '', jumlah_bibit: '' })
const formKolam = ref({ nama_kolam: '', luas_m2: '', jenis_id: '' })
const formEditKolam = ref({ nama_kolam: '', luas_m2: '', jenis_id: '' })

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
  formKolam.value = { nama_kolam: '', luas_m2: '', jenis_id: '' }
  showTambahKolam.value = true
}

function bukaEditKolam(kolam) {
  kolamDiedit.value = kolam
  formEditKolam.value = {
    nama_kolam: kolam.nama_kolam,
    luas_m2: kolam.luas_m2 || '',
    jenis_id: kolam.jenis_id || ''
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
    luas_m2: formKolam.value.luas_m2 ? Number(formKolam.value.luas_m2) : null,
    jenis_id: formKolam.value.jenis_id || null
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
    luas_m2: formEditKolam.value.luas_m2 ? Number(formEditKolam.value.luas_m2) : null,
    jenis_id: formEditKolam.value.jenis_id || null
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

// ===== Search & Filter =====
const kolamTerfilter = computed(() => {
  const kata = pencarian.value.trim().toLowerCase()

  return daftarKolam.value.filter((k) => {
    const namaJenis = (k.nama_jenis || k.nama_ikan || '').toLowerCase()

    const cocokKata =
      !kata ||
      k.nama_kolam.toLowerCase().includes(kata) ||
      namaJenis.includes(kata)

    const cocokJenis =
      !filterJenis.value ||
      String(k.jenis_id) === String(filterJenis.value) ||
      namaJenis === filterJenis.value.toLowerCase()

    const cocokStatus = !filterStatus.value || k.status === filterStatus.value

    return cocokKata && cocokJenis && cocokStatus
  })
})

function resetFilter() {
  pencarian.value = ''
  filterJenis.value = ''
  filterStatus.value = ''
}

onMounted(() => {
  muatKolam()
  muatJenisIkan()
})
</script>

<template>
  <div>
    <!-- Tombol Tambah (judul halaman sudah ada di header atas, tidak diulang di sini) -->
    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="bukaTambahKolam"
      >
        + Tambah Kolam
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="relative flex-1 min-w-0">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 4.65a7.5 7.5 0 0011.9 11.9z" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari nama kolam atau jenis..."
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white pl-9 pr-3 py-2.5 text-[13.5px]"
        />
      </div>

      <select
        v-model="filterJenis"
        class="w-full sm:w-56 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option value="">Semua jenis</option>
        <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
      </select>

      <select
        v-model="filterStatus"
        class="w-full sm:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option value="">Semua status</option>
        <option value="aktif">Aktif</option>
        <option value="kosong">Kosong</option>
      </select>

      <button
        v-if="pencarian || filterJenis || filterStatus"
        type="button"
        class="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 text-[13px] font-medium hover:bg-ink-50 dark:hover:bg-ink-600 shrink-0"
        @click="resetFilter"
      >
        Reset
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
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Tebar</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Bibit</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="k in kolamTerfilter"
            :key="k.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
            <td class="px-4 py-3">{{ k.luas_m2 ? Number(k.luas_m2).toLocaleString('id-ID') : '-' }}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-[11.5px] font-semibold"
                :class="k.status === 'aktif'
                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400'
                  : 'bg-ink-100 text-ink-500 dark:bg-ink-500/40 dark:text-ink-200'"
              >
                {{ k.status === 'aktif' ? 'Aktif' : 'Kosong' }}
              </span>
            </td>
            <!--
              Prioritas tampilan: nama_jenis (jenis yang ditetapkan langsung di kolam saat
              dibuat/diedit) -> fallback ke nama_ikan (jenis dari siklus tebar aktif, untuk
              kompatibilitas dengan data lama) -> '-' kalau dua-duanya kosong.
            -->
            <td class="px-4 py-3">{{ k.nama_jenis || k.nama_ikan || '-' }}</td>
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
                class="px-3 py-1.5 rounded-lg bg-ink-700 dark:bg-ink-500 text-white text-[12.5px] font-semibold hover:bg-ink-800 dark:hover:bg-ink-400"
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
          <tr v-else-if="kolamTerfilter.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              Tidak ada kolam yang cocok dengan pencarian/filter kamu.
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
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jenis</label>
            <select
              v-model="form.jenis_ikan_id"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            >
              <option value="" disabled>Pilih jenis</option>
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
              Jenis <span class="text-ink-400 dark:text-ink-400 font-normal">(opsional)</span>
            </label>
            <select
              v-model="formKolam.jenis_id"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            >
              <option value="">Belum ditentukan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
            <p class="text-[11.5px] text-ink-400 mt-1">Boleh dikosongkan dulu, bisa ditentukan saat Tebar Bibit.</p>
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
              Jenis <span class="text-ink-400 dark:text-ink-400 font-normal">(opsional)</span>
            </label>
            <select
              v-model="formEditKolam.jenis_id"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
            >
              <option value="">Belum ditentukan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
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
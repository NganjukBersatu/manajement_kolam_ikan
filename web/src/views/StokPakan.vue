<script setup>
import { ref, computed, onMounted } from 'vue'
import NavIcon from '../components/NavIcon.vue'

const loading = ref(true)
const loadingRiwayat = ref(true)
const error = ref('')
const daftarStok = ref([])
const riwayatPakan = ref([])
const showForm = ref(false)
const showRiwayatModal = ref(false)
const isEdit = ref(false)
const editId = ref(null)

// Modal sukses (muncul setelah tambah/edit jenis pakan berhasil disimpan)
const showSuksesModal = ref(false)
const pesanSukses = ref('')

function tutupSukses() {
  showSuksesModal.value = false
  pesanSukses.value = ''
}

// Modal hapus
const showHapusModal = ref(false)
const itemYangAkanDihapus = ref(null)

function bukaHapus(item) {
  itemYangAkanDihapus.value = item
  showHapusModal.value = true
}

function tutupHapus() {
  showHapusModal.value = false
  itemYangAkanDihapus.value = null
}

async function konfirmasiHapus() {
  if (!itemYangAkanDihapus.value) return
  const res = await fetch(`/api/stok-pakan/${itemYangAkanDihapus.value.id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menghapus')
    return
  }
  tutupHapus()
  await Promise.all([muat(), muatRiwayat()])
}

const pencarianAktivitas = ref('')
const filterKolam = ref('')

const form = ref({
  nama: '',
  stok_awal: '',
  satuan: 'kg',
  stok_minimum: '10'
})

function angka(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function labelSesi(sesi) {
  const map = { pagi: 'Pagi', siang: 'Siang', sore: 'Sore' }
  return map[sesi] || sesi
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

async function muatRiwayat() {
  loadingRiwayat.value = true
  try {
    const res = await fetch('/api/pakan')
    if (res.ok) {
      const json = await res.json()
      riwayatPakan.value = json.data || []
    }
  } catch (e) {
    console.error('Gagal memuat riwayat pakan:', e)
  } finally {
    loadingRiwayat.value = false
  }
}

function bukaTambah() {
  isEdit.value = false
  editId.value = null
  form.value = {
    nama: '',
    stok_awal: '',
    satuan: 'kg',
    stok_minimum: '10'
  }
  showForm.value = true
}

function bukaEdit(item) {
  isEdit.value = true
  editId.value = item.id
  form.value = {
    nama: item.nama || '',
    stok_awal: item.stok ?? '',
    satuan: item.satuan || 'kg',
    stok_minimum: item.stok_minimum ?? '10'
  }
  showForm.value = true
}

async function simpan() {
  const payload = {
    nama: form.value.nama,
    stok: Number(form.value.stok_awal) || 0,
    satuan: form.value.satuan || 'kg',
    stok_minimum: Number(form.value.stok_minimum) || 0
  }

  const sedangEdit = isEdit.value

  let res
  if (sedangEdit) {
    res = await fetch(`/api/stok-pakan/${editId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } else {
    res = await fetch('/api/stok-pakan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan jenis pakan')
    return
  }

  showForm.value = false
  isEdit.value = false
  editId.value = null
  form.value = {
    nama: '',
    stok_awal: '',
    satuan: 'kg',
    stok_minimum: '10'
  }
  await Promise.all([muat(), muatRiwayat()])

  // Tampilkan modal sukses setelah data selesai dimuat ulang
  pesanSukses.value = sedangEdit ? 'Jenis pakan berhasil diperbarui.' : 'Jenis pakan berhasil ditambahkan.'
  showSuksesModal.value = true
}

const totalJenis = computed(() => daftarStok.value.length)
const stokMenipis = computed(() =>
  daftarStok.value.filter(s => angka(s.stok) <= angka(s.stok_minimum)).length
)

const totalStokPerSatuan = computed(() => {
  const kelompok = {}
  for (const s of daftarStok.value) {
    const satuan = s.satuan || 'kg'
    kelompok[satuan] = (kelompok[satuan] || 0) + angka(s.stok)
  }
  return Object.entries(kelompok).map(([satuan, total]) => ({ satuan, total }))
})

const totalPakanKeluarKg = computed(() =>
  riwayatPakan.value.reduce((sum, item) => sum + Number(item.jumlah_kg || 0), 0)
)

const daftarKolamTersedia = computed(() => {
  const set = new Set()
  riwayatPakan.value.forEach(r => {
    if (r.nama_kolam) set.add(r.nama_kolam)
  })
  return Array.from(set).sort()
})

const riwayatTerfilter = computed(() => {
  const q = pencarianAktivitas.value.trim().toLowerCase()
  const kolam = filterKolam.value

  return riwayatPakan.value.filter(item => {
    const cocokKolam = !kolam || item.nama_kolam === kolam
    const gabungan = `${item.nama_kolam || ''} ${item.nama_pakan || ''} ${item.catatan || ''}`.toLowerCase()
    const cocokKata = !q || gabungan.includes(q)
    return cocokKolam && cocokKata
  })
})

onMounted(() => {
  muat()
  muatRiwayat()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Aksi -->
    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-200 text-[13.5px] font-semibold hover:bg-ink-50 dark:hover:bg-ink-900/40 transition"
        @click="showRiwayatModal = true"
      >
        <NavIcon name="utensils" :size="15" />
        Lihat Riwayat Aktivitas
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 transition shadow-sm"
        @click="bukaTambah"
      >
        <NavIcon name="plus" :size="15" />
        Tambah Jenis Pakan
      </button>
    </div>

    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Jenis pakan terdaftar</p>
        <p class="text-2xl font-bold dark:text-white mt-1">{{ totalJenis }}</p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Stok menipis</p>
        <p class="text-2xl font-bold mt-1" :class="stokMenipis > 0 ? 'text-danger-600 dark:text-danger-400' : 'dark:text-white'">
          {{ stokMenipis }}
        </p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total sisa stok</p>
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
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300">Total pakan keluar</p>
        <p class="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">
          {{ totalPakanKeluarKg.toLocaleString('id-ID') }}
          <span class="text-[13px] font-medium text-ink-500 dark:text-ink-300">kg</span>
        </p>
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
      <div class="px-4 py-3 border-b border-ink-100 dark:border-ink-500 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <NavIcon name="package" :size="16" class="text-brand-500" />
          <h2 class="text-[14.5px] font-semibold dark:text-white">Daftar Jenis Pakan & Sisa Stok</h2>
        </div>
        <span class="text-[12px] text-ink-400">Total {{ daftarStok.length }} jenis</span>
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
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 hover:bg-ink-50/30 dark:hover:bg-ink-900/20 dark:text-ink-100"
          >
            <td class="px-4 py-3 font-medium">{{ s.nama }}</td>
            <td class="px-4 py-3 font-semibold">
              {{ angka(s.stok).toLocaleString('id-ID') }} {{ s.satuan || 'kg' }}
            </td>
            <td class="px-4 py-3 text-ink-500 dark:text-ink-300">
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
              <div class="flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="text-blue-600 dark:text-blue-400 text-[13px] font-semibold hover:underline"
                  @click="bukaEdit(s)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="text-danger-600 dark:text-danger-400 text-[13px] font-semibold hover:underline"
                  @click="bukaHapus(s)"
                >
                  Hapus
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!daftarStok.length">
            <td colspan="5" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Belum ada jenis pakan. Klik "Tambah Jenis Pakan" di atas untuk mulai.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah / Edit Jenis Pakan -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5 z-10">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">
          {{ isEdit ? 'Edit Jenis Pakan' : 'Tambah Jenis Pakan' }}
        </h2>
        <form class="space-y-3.5" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Pakan</label>
            <input
              v-model="form.nama"
              type="text"
              required
              placeholder="Contoh: Pelet PF-1000, 781-2"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Stok Awal / Sisa Stok</label>
              <input
                v-model="form.stok_awal"
                type="number"
                min="0"
                step="0.1"
                required
                placeholder="Contoh: 50"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Satuan</label>
              <select
                v-model="form.satuan"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]"
              >
                <option value="kg">kg</option>
                <option value="sak">sak</option>
                <option value="liter">liter</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Batas Minimum Peringatan</label>
            <input
              v-model="form.stok_minimum"
              type="number"
              min="0"
              step="0.1"
              placeholder="Contoh: 10"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]"
            />
            <p class="text-[11.5px] text-ink-400 mt-1">Sistem akan memberi notifikasi saat sisa stok di bawah batas ini.</p>
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
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 transition"
            >
              {{ isEdit ? 'Simpan Perubahan' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Riwayat Aktivitas Pakan -->
    <div v-if="showRiwayatModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showRiwayatModal = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-3xl max-h-[85vh] flex flex-col z-10">
        <div class="p-4 border-b border-ink-100 dark:border-ink-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <NavIcon name="utensils" :size="16" class="text-brand-500" />
              <h2 class="text-[15px] font-semibold dark:text-white">Riwayat Pakan Keluar (Aktivitas per Kolam)</h2>
            </div>
            <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mt-0.5">
              Catatan pemakaian pakan harian ke masing-masing kolam budidaya.
            </p>
          </div>
          <button type="button" class="text-ink-400 hover:text-ink-600 dark:hover:text-white" @click="showRiwayatModal = false">
            <NavIcon name="x" :size="18" />
          </button>
        </div>

        <div class="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-ink-100 dark:border-ink-500">
          <div class="relative flex-1">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="pencarianAktivitas"
              type="text"
              placeholder="Cari kolam / pakan..."
              class="w-full pl-8 pr-2.5 py-1.5 text-[12.5px] border border-ink-100 dark:border-ink-500 rounded-lg dark:bg-ink-900 dark:text-white"
            />
          </div>

          <select
            v-model="filterKolam"
            class="text-[12.5px] border border-ink-100 dark:border-ink-500 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-900 dark:text-white"
          >
            <option value="">Semua Kolam</option>
            <option v-for="k in daftarKolamTersedia" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>

        <div class="overflow-y-auto overflow-x-auto flex-1">
          <table class="w-full text-left text-[13px]">
            <thead>
              <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40 sticky top-0">
                <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal & Sesi</th>
                <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam Tujuan</th>
                <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Pakan</th>
                <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Keluar</th>
                <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingRiwayat">
                <td colspan="5" class="px-4 py-8 text-center text-ink-400">Memuat riwayat pemakaian pakan...</td>
              </tr>
              <tr v-else-if="!riwayatTerfilter.length">
                <td colspan="5" class="px-4 py-8 text-center text-ink-400">
                  {{ pencarianAktivitas || filterKolam ? 'Tidak ada riwayat pakan yang sesuai pencarian.' : 'Belum ada catatan aktivitas pakan keluar.' }}
                </td>
              </tr>
              <tr
                v-for="r in riwayatTerfilter"
                :key="r.id"
                class="border-b border-ink-100 dark:border-ink-500 last:border-0 hover:bg-ink-50/30 dark:hover:bg-ink-900/20 dark:text-ink-100"
              >
                <td class="px-4 py-3 whitespace-nowrap">
                  <div class="font-medium">{{ tanggal(r.tanggal) }}</div>
                  <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 capitalize">
                    Sesi {{ labelSesi(r.sesi) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-semibold">
                  <span class="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <NavIcon name="fish" :size="13" />
                    {{ r.nama_kolam || '-' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-ink-700 dark:text-ink-200">
                  {{ r.nama_pakan || 'Pakan Umum' }}
                </td>
                <td class="px-4 py-3 font-semibold text-danger-600 dark:text-danger-400 whitespace-nowrap">
                  - {{ r.jumlah_kg }} kg
                </td>
                <td class="px-4 py-3 text-ink-500 dark:text-ink-400 text-[12px]">
                  {{ r.catatan || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus -->
    <Teleport to="body">
      <div v-if="showHapusModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupHapus"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Hapus Jenis Pakan?</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">
              Jenis pakan <strong>"{{ itemYangAkanDihapus?.nama }}"</strong> akan dihapus permanen. Data ini tidak bisa dikembalikan.
            </p>
          </div>
          <div class="px-6 pb-6 pt-4 flex gap-3">
            <button type="button" @click="tutupHapus" class="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 dark:border-ink-600 text-[13.5px] font-medium text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition">
              Batal
            </button>
            <button type="button" @click="konfirmasiHapus" class="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13.5px] font-medium transition">
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Sukses (tambah/edit jenis pakan berhasil disimpan) -->
    <Teleport to="body">
      <div v-if="showSuksesModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupSukses"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-ok-50 dark:bg-ok-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-ok-500">
                <path d="M20 6 9 17l-5-5"></path>
              </svg>
            </div>
          </div>
          <div class="px-6 pb-2 text-center">
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Berhasil!</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">
              {{ pesanSukses }}
            </p>
          </div>
          <div class="px-6 pb-6 pt-4">
            <button type="button" @click="tutupSukses" class="w-full px-4 py-2.5 rounded-xl bg-ok-500 hover:bg-ok-600 text-white text-[13.5px] font-medium transition">
              Oke
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
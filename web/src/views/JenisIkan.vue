<script setup>
import { ref, computed, onMounted } from 'vue'
import NavIcon from '../components/NavIcon.vue'

const daftar = ref([])
const loading = ref(true)
const menyimpan = ref(false)
const pencarian = ref('')

const showModal = ref(false)
const modeEdit = ref(false)
const idDiedit = ref(null)

// Modal hapus
const showHapusModal = ref(false)
const itemYangAkanDihapus = ref(null)

// Modal sukses
const showSuksesModal = ref(false)
const pesanSukses = ref('')

function tutupSukses() {
  showSuksesModal.value = false
  pesanSukses.value = ''
}

const form = ref({
  nama: '',
  harga_per_kg: ''
})

function resetForm() {
  form.value = {
    nama: '',
    harga_per_kg: ''
  }
  modeEdit.value = false
  idDiedit.value = null
}

function bukaTambah() {
  resetForm()
  showModal.value = true
}

function bukaEdit(item) {
  form.value = {
    nama: item.nama,
    harga_per_kg: item.harga_per_kg || 0
  }
  modeEdit.value = true
  idDiedit.value = item.id
  showModal.value = true
}

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
  try {
    const res = await fetch(`/api/jenis-ikan/${itemYangAkanDihapus.value.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.message || 'Gagal menghapus jenis ikan')
      return
    }
    tutupHapus()
    await muat()
  } catch (err) {
    alert(err.message || 'Terjadi kesalahan')
  }
}

async function muat() {
  loading.value = true
  try {
    const res = await fetch('/api/jenis-ikan')
    if (!res.ok) throw new Error('Gagal mengambil data jenis ikan')
    const json = await res.json()
    daftar.value = json.data || []
  } catch (err) {
    alert(err.message || 'Gagal memuat data')
  } finally {
    loading.value = false
  }
}

async function simpan() {
  if (!form.value.nama) {
    alert('Nama ikan wajib diisi!')
    return
  }

  menyimpan.value = true
  try {
    const payload = {
      nama: form.value.nama,
      harga_per_kg: Number(form.value.harga_per_kg) || 0
    }

    const sedangEdit = modeEdit.value
    const url = sedangEdit ? `/api/jenis-ikan/${idDiedit.value}` : '/api/jenis-ikan'
    const method = sedangEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert((err.message || 'Gagal menyimpan jenis ikan') + (err.error ? `\n\nDetail: ${err.error}` : ''))
      return
    }

    showModal.value = false
    resetForm()
    await muat()

    pesanSukses.value = sedangEdit ? 'Jenis ikan berhasil diperbarui.' : 'Jenis ikan berhasil ditambahkan.'
    showSuksesModal.value = true
  } catch (err) {
    alert(err.message || 'Terjadi kesalahan sistem')
  } finally {
    menyimpan.value = false
  }
}

function rupiah(n) {
  return 'Rp' + Number(n || 0).toLocaleString('id-ID')
}

const dataTerfilter = computed(() => {
  const q = pencarian.value.trim().toLowerCase()
  if (!q) return daftar.value
  return daftar.value.filter(item => (item.nama || '').toLowerCase().includes(q))
})

const totalJenis = computed(() => daftar.value.length)

const rataRataHarga = computed(() => {
  if (daftar.value.length === 0) return 0
  const total = daftar.value.reduce((sum, item) => sum + Number(item.harga_per_kg || 0), 0)
  return Math.round(total / daftar.value.length)
})

const ikanTermahal = computed(() => {
  if (daftar.value.length === 0) return null
  return [...daftar.value].sort((a, b) => Number(b.harga_per_kg || 0) - Number(a.harga_per_kg || 0))[0]
})

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-end">
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 transition shadow-sm"
        @click="bukaTambah"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Tambah Jenis Ikan
      </button>
    </div>

    <!-- Ringkasan Statistik -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Total Jenis Ikan</p>
        <p class="text-2xl font-bold dark:text-white">{{ totalJenis }} <span class="text-sm font-normal text-ink-400">spesies</span></p>
      </div>

      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Rata-rata Harga Jual / kg</p>
        <p class="text-2xl font-bold text-brand-500 dark:text-brand-400">{{ rupiah(rataRataHarga) }}</p>
      </div>

      <div class="bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 rounded-card shadow-card p-4">
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-1">Harga Tertinggi</p>
        <p class="text-2xl font-bold text-success-600 dark:text-success-400" v-if="ikanTermahal">
          {{ rupiah(ikanTermahal.harga_per_kg) }}
          <span class="text-xs font-medium text-ink-400">({{ ikanTermahal.nama }})</span>
        </p>
        <p class="text-sm text-ink-400" v-else>-</p>
      </div>
    </div>

    <!-- Pencarian -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari jenis ikan..."
          class="w-full pl-9 pr-3 py-2 text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg bg-white dark:bg-ink-900 dark:text-white placeholder:text-ink-400"
        />
      </div>
    </div>

    <!-- Tabel -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Nama Ikan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Harga Jual / kg</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="3" class="px-4 py-8 text-center text-[13px] text-ink-500 dark:text-ink-300">Memuat data jenis ikan...</td>
          </tr>
          <tr v-else-if="dataTerfilter.length === 0">
            <td colspan="3" class="px-4 py-8 text-center text-[13px] text-ink-500 dark:text-ink-300">
              {{ pencarian ? 'Tidak ada jenis ikan yang cocok dengan kata kunci.' : 'Belum ada jenis ikan terdaftar.' }}
            </td>
          </tr>
          <tr
            v-for="item in dataTerfilter"
            :key="item.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 hover:bg-ink-50/30 dark:hover:bg-ink-900/20 dark:text-ink-100"
          >
            <td class="px-4 py-3.5 font-medium flex items-center gap-2">
              <span class="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                <NavIcon name="fish" :size="15" />
              </span>
              {{ item.nama }}
            </td>
            <td class="px-4 py-3.5">
              <span class="font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2.5 py-1 rounded-md">
                {{ rupiah(item.harga_per_kg) }}
              </span>
            </td>
            <td class="px-4 py-3.5 text-right space-x-3">
              <button type="button" class="text-brand-600 dark:text-brand-400 text-[13px] font-semibold hover:underline" @click="bukaEdit(item)">
                Edit
              </button>
              <button type="button" class="text-danger-600 dark:text-danger-500 text-[13px] font-semibold hover:underline" @click="bukaHapus(item)">
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form Tambah / Edit -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <!-- Backdrop transparan hitam -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="showModal = false"></div>

      <div class="relative bg-white dark:bg-ink-700 rounded-2xl shadow-2xl w-full max-w-md p-5 z-10">
        <h2 class="text-[16px] font-semibold dark:text-white mb-1">
          {{ modeEdit ? 'Edit Jenis Ikan' : 'Tambah Jenis Ikan' }}
        </h2>
        <p class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-4">
          Tentukan nama ikan dan harga jual per kg sebagai acuan transaksi.
        </p>

        <form class="space-y-3.5" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Ikan</label>
            <input
              v-model="form.nama"
              type="text"
              required
              placeholder="Contoh: Lele Sangkuriang, Nila Hitam"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13.5px]"
            />
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Harga Jual per Kg (Rp)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-ink-400">Rp</span>
              <input
                v-model="form.harga_per_kg"
                type="number"
                min="0"
                step="500"
                required
                placeholder="Contoh: 28000"
                class="w-full pl-10 pr-3 py-2 text-[13.5px] border border-ink-100 dark:border-ink-500 rounded-lg dark:bg-ink-900 dark:text-white"
              />
            </div>
            <div class="mt-1 flex items-center justify-between text-[12px] text-ink-500 dark:text-ink-300">
              <span>Preview: <b class="text-brand-500 dark:text-brand-400">{{ rupiah(form.harga_per_kg) }}</b> / kg</span>
              <span class="text-[11px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-1.5 py-0.5 rounded">Otomatis di Transaksi</span>
            </div>
          </div>

          <div class="flex gap-3 pt-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold hover:bg-ink-50 dark:hover:bg-ink-800 transition"
              @click="showModal = false"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="menyimpan"
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60 transition shadow-sm"
            >
              {{ menyimpan ? 'Menyimpan...' : (modeEdit ? 'Perbarui' : 'Simpan') }}
            </button>
          </div>
        </form>
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
            <h3 class="text-[16px] font-semibold text-ink-900 dark:text-white">Hapus Jenis Ikan?</h3>
            <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mt-1.5">
              Jenis ikan <strong>"{{ itemYangAkanDihapus?.nama }}"</strong> akan dihapus permanen.
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

    <!-- Modal Sukses -->
    <Teleport to="body">
      <div v-if="showSuksesModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]" @click="tutupSukses"></div>
        <div class="relative bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="pt-6 pb-2 flex justify-center">
            <div class="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-500">
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
            <button type="button" @click="tutupSukses" class="w-full px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[13.5px] font-medium transition">
              Oke
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
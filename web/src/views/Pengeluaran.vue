<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const loading = ref(true)
const daftar = ref([])
const total = ref(0)

const sekarang = new Date()
const selectedMonth = ref(sekarang.getMonth() + 1)
const selectedYear = ref(sekarang.getFullYear())

// ===================== Search & Filter =====================
const pencarian = ref('')
const filterKategori = ref('')
const filterWaktu = ref('semua')
const tanggalMulai = ref('')
const tanggalAkhir = ref('')

// ===================== Modal Form =====================
const showModal = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const form = ref({
  id: null,
  tanggal: '',
  kategori: '',
  deskripsi: '',
  jumlah: ''
})
const formError = ref('')

// ===================== Modal Hapus & Sukses =====================
const showConfirmHapus = ref(false)
const itemHapus = ref(null)
const hapusLoading = ref(false)

const showSukses = ref(false)
const pesanSukses = ref('')

const daftarBulan = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

const OPSI_WAKTU = [
  { value: 'semua', label: 'Semua waktu' },
  { value: 'hari_ini', label: 'Hari ini' },
  { value: 'kemarin', label: 'Kemarin' },
  { value: '7_hari', label: '7 hari terakhir' },
  { value: 'kustom', label: 'Rentang tanggal kustom' }
]

const namaPeriode = computed(() => {
  const bulan = daftarBulan.find(b => b.value === selectedMonth.value)?.label || ''
  return `${bulan} ${selectedYear.value}`
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

function ymd(d) {
  if (!d) return ''
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
}

function hitungRentangWaktu() {
  const sekarang = new Date()
  const hariIni = ymd(sekarang)

  switch (filterWaktu.value) {
    case 'hari_ini':
      return { dari: hariIni, sampai: hariIni }
    case 'kemarin': {
      const kemarin = new Date(sekarang)
      kemarin.setDate(kemarin.getDate() - 1)
      const s = ymd(kemarin)
      return { dari: s, sampai: s }
    }
    case '7_hari': {
      const awal = new Date(sekarang)
      awal.setDate(awal.getDate() - 6)
      return { dari: ymd(awal), sampai: hariIni }
    }
    case 'kustom':
      if (!tanggalMulai.value && !tanggalAkhir.value) return null
      return {
        dari: tanggalMulai.value || '0000-01-01',
        sampai: tanggalAkhir.value || '9999-12-31'
      }
    default:
      return null
  }
}

function cocokRentangTanggal(tgl) {
  const rentang = hitungRentangWaktu()
  if (!rentang) return true
  const t = ymd(tgl)
  return t >= rentang.dari && t <= rentang.sampai
}

async function muat() {
  loading.value = true
  try {
    const resPengeluaran = await fetch(
      `/api/pengeluaran?bulan=${selectedMonth.value}&tahun=${selectedYear.value}`
    )
    const jsonPengeluaran = await resPengeluaran.json()
    const dataPengeluaran = (jsonPengeluaran.data || []).map(item => ({
      ...item,
      kategori: item.kategori || 'Pengeluaran Lain',
      jumlah: Number(item.jumlah || 0),
      isPakan: false
    }))

    const resPakan = await fetch(
      `/api/pakan?bulan=${selectedMonth.value}&tahun=${selectedYear.value}`
    )
    const jsonPakan = await resPakan.json()
    const dataPakan = (jsonPakan.data || []).map(item => ({
      id: `pakan-${item.id}`,
      tanggal: item.tanggal,
      kategori: 'Pakan Harian',
      deskripsi: item.deskripsi || `Pakan ${item.jenis_pakan || ''}`.trim(),
      jumlah: Number(item.total || item.jumlah || item.biaya || 0),
      isPakan: true
    }))

    daftar.value = [...dataPengeluaran, ...dataPakan].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    )

    total.value = daftar.value.reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
  } catch (err) {
    console.error(err)
    daftar.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const daftarTerfilter = computed(() => {
  const kata = pencarian.value.trim().toLowerCase()

  return daftar.value.filter((p) => {
    const cocokKata =
      !kata ||
      (p.deskripsi || '').toLowerCase().includes(kata) ||
      (p.kategori || '').toLowerCase().includes(kata)

    const cocokKategori = !filterKategori.value || p.kategori === filterKategori.value

    return cocokKata && cocokKategori && cocokRentangTanggal(p.tanggal)
  })
})

const totalTerfilter = computed(() =>
  daftarTerfilter.value.reduce((sum, item) => sum + Number(item.jumlah || 0), 0)
)

const adaFilterAktif = computed(() =>
  !!(pencarian.value || filterKategori.value || filterWaktu.value !== 'semua')
)

function resetFilter() {
  pencarian.value = ''
  filterKategori.value = ''
  filterWaktu.value = 'semua'
  tanggalMulai.value = ''
  tanggalAkhir.value = ''
}

// ===================== Modal Form Functions =====================
function bukaTambah() {
  isEdit.value = false
  form.value = {
    id: null,
    tanggal: ymd(new Date()),
    kategori: '',
    deskripsi: '',
    jumlah: ''
  }
  formError.value = ''
  showModal.value = true
}

function bukaEdit(item) {
  if (item.isPakan) return

  isEdit.value = true
  form.value = {
    id: item.id,
    tanggal: ymd(item.tanggal),
    kategori: item.kategori,
    deskripsi: item.deskripsi || '',
    jumlah: item.jumlah
  }
  formError.value = ''
  showModal.value = true
}

function tutupModal() {
  showModal.value = false
  formError.value = ''
}

async function simpan() {
  formError.value = ''

  if (!form.value.tanggal) {
    formError.value = 'Tanggal wajib diisi'
    return
  }
  if (!form.value.kategori || !form.value.kategori.trim()) {
    formError.value = 'Kategori wajib diisi'
    return
  }
  if (!form.value.jumlah || isNaN(form.value.jumlah) || Number(form.value.jumlah) <= 0) {
    formError.value = 'Jumlah harus angka lebih dari 0'
    return
  }

  formLoading.value = true

  try {
    const body = {
      tanggal: form.value.tanggal,
      kategori: form.value.kategori.trim(),
      deskripsi: form.value.deskripsi || null,
      jumlah: Number(form.value.jumlah)
    }

    let res
    if (isEdit.value) {
      res = await fetch(`/api/pengeluaran/${form.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    } else {
      res = await fetch('/api/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    }

    const json = await res.json()

    if (!res.ok) {
      formError.value = json.message || 'Gagal menyimpan data'
      return
    }

    tutupModal()
    pesanSukses.value = isEdit.value
      ? 'Pengeluaran berhasil diperbarui.'
      : 'Pengeluaran berhasil ditambahkan.'
    showSukses.value = true
    await muat()
  } catch (err) {
    console.error(err)
    formError.value = 'Terjadi kesalahan jaringan'
  } finally {
    formLoading.value = false
  }
}

// ===================== Modal Hapus & Sukses Functions =====================
function bukaKonfirmasiHapus(item) {
  if (item.isPakan) {
    pesanSukses.value = 'Data Pakan Harian tidak bisa dihapus dari halaman ini.'
    showSukses.value = true
    return
  }
  itemHapus.value = item
  showConfirmHapus.value = true
}

function tutupKonfirmasiHapus() {
  showConfirmHapus.value = false
  itemHapus.value = null
}

async function konfirmasiHapus() {
  if (!itemHapus.value) return

  hapusLoading.value = true
  try {
    const res = await fetch(`/api/pengeluaran/${itemHapus.value.id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const json = await res.json()
      pesanSukses.value = json.message || 'Gagal menghapus'
      showSukses.value = true
      return
    }

    tutupKonfirmasiHapus()
    pesanSukses.value = 'Pengeluaran berhasil dihapus.'
    showSukses.value = true
    await muat()
  } catch (err) {
    console.error(err)
    pesanSukses.value = 'Terjadi kesalahan jaringan'
    showSukses.value = true
  } finally {
    hapusLoading.value = false
  }
}

function tutupSukses() {
  showSukses.value = false
  pesanSukses.value = ''
}

watch([selectedMonth, selectedYear], () => {
  muat()
})

onMounted(muat)
</script>

<template>
  <div class="space-y-6">
    <!-- Header: Tombol Tambah saja -->
    <div class="flex justify-end">
      <button
        @click="bukaTambah"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600 transition shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Pengeluaran
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="flex flex-col lg:flex-row gap-3">
      <div class="relative w-full lg:flex-1">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-300 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="pencarian"
          type="text"
          placeholder="Cari deskripsi atau kategori..."
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white pl-10 pr-3 py-2.5 text-[13.5px]"
        />
      </div>

      <select
        v-model="filterKategori"
        class="w-full lg:w-48 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option value="">Semua kategori</option>
        <option value="Pakan Harian">Pakan Harian</option>
        <option value="obat">Obat</option>
        <option value="listrik">Listrik</option>
        <option value="gaji">Gaji</option>
        <option value="perlengkapan">Perlengkapan</option>
        <option value="lainnya">Lainnya</option>
      </select>

      <select
        v-model="filterWaktu"
        class="w-full lg:w-56 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
      >
        <option v-for="o in OPSI_WAKTU" :key="o.value" :value="o.value">
          {{ o.label }}
        </option>
      </select>

      <template v-if="filterWaktu === 'kustom'">
        <input
          v-model="tanggalMulai"
          type="date"
          class="w-full lg:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
        />
        <input
          v-model="tanggalAkhir"
          type="date"
          class="w-full lg:w-40 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
        />
      </template>

      <button
        v-if="adaFilterAktif"
        type="button"
        class="w-full lg:w-auto px-3 py-2.5 rounded-lg border border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300 text-[13px] font-medium hover:bg-ink-50 dark:hover:bg-ink-600 shrink-0"
        @click="resetFilter"
      >
        Reset
      </button>
    </div>

    <!-- Kartu Total -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <p class="text-[13px] text-ink-500 dark:text-ink-300">
        Total Pengeluaran — {{ namaPeriode }}
        <span v-if="adaFilterAktif" class="text-ink-400">(hasil filter)</span>
      </p>
      <p class="text-2xl font-bold text-danger-600 dark:text-danger-500 mt-1">
        {{ rupiah(adaFilterAktif ? totalTerfilter : total) }}
      </p>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mt-1">
        {{ adaFilterAktif ? daftarTerfilter.length : daftar.length }} transaksi
        <span v-if="adaFilterAktif && daftar.length">
          dari {{ daftar.length }} total
        </span>
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-[13.5px] text-ink-500 dark:text-ink-300 py-10 text-center">
      Memuat data...
    </div>

    <!-- Tabel -->
    <div
      v-else
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kategori</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Deskripsi</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Total</th>
            <th class="px-4 py-3 text-center text-ink-500 dark:text-ink-300 font-semibold w-32">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in daftarTerfilter"
            :key="p.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3 capitalize">{{ p.kategori }}</td>
            <td class="px-4 py-3">{{ p.deskripsi || '-' }}</td>
            <td class="px-4 py-3 text-right font-semibold">{{ rupiah(p.jumlah) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                <button
                  v-if="!p.isPakan"
                  @click="bukaEdit(p)"
                  class="px-2.5 py-1.5 rounded-md text-[12px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition"
                >
                  Edit
                </button>

                <button
                  v-if="!p.isPakan"
                  @click="bukaKonfirmasiHapus(p)"
                  class="px-2.5 py-1.5 rounded-md text-[12px] font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition"
                >
                  Hapus
                </button>

                <span
                  v-else
                  class="text-[11px] text-ink-400 dark:text-ink-400 italic"
                >
                  dari Pakan
                </span>
              </div>
            </td>
          </tr>

          <tr v-if="!daftar.length">
            <td colspan="5" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Belum ada pengeluaran di {{ namaPeriode }}
            </td>
          </tr>

          <tr v-else-if="!daftarTerfilter.length">
            <td colspan="5" class="px-4 py-10 text-center text-ink-400 dark:text-ink-300">
              Tidak ada data yang cocok dengan pencarian/filter kamu.
            </td>
          </tr>
        </tbody>

        <tfoot v-if="daftarTerfilter.length">
          <tr class="border-t border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <td colspan="3" class="px-4 py-3 font-semibold text-right dark:text-white">
              Total Bersih
            </td>
            <td class="px-4 py-3 text-right font-bold text-danger-600 dark:text-danger-500">
              {{ rupiah(totalTerfilter) }}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ===================== MODAL FORM ===================== -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="tutupModal"
        ></div>

        <div class="relative w-full max-w-md rounded-xl bg-white dark:bg-ink-800 shadow-2xl border border-ink-100 dark:border-ink-600">
          <div class="flex items-center justify-between border-b border-ink-100 dark:border-ink-600 px-6 py-4">
            <h2 class="text-lg font-semibold text-ink-800 dark:text-white">
              {{ isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}
            </h2>
            <button
              @click="tutupModal"
              class="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 hover:text-ink-600 dark:hover:text-white transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="simpan" class="p-6 space-y-4">
            <div
              v-if="formError"
              class="rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[13px] px-4 py-3"
            >
              {{ formError }}
            </div>

            <div>
              <label class="block text-[13px] font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                Tanggal <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.tanggal"
                type="date"
                required
                class="w-full rounded-lg border border-ink-200 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label class="block text-[13px] font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                Kategori <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.kategori"
                type="text"
                required
                placeholder="Contoh: Obat, Listrik, Gaji, Perlengkapan, dll"
                class="w-full rounded-lg border border-ink-200 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label class="block text-[13px] font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                Deskripsi
              </label>
              <textarea
                v-model="form.deskripsi"
                rows="2"
                placeholder="Contoh: selang air, obat kolam lele, dll"
                class="w-full rounded-lg border border-ink-200 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
              ></textarea>
            </div>

            <div>
              <label class="block text-[13px] font-medium text-ink-600 dark:text-ink-300 mb-1.5">
                Jumlah (Rp) <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.jumlah"
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 150000"
                required
                class="w-full rounded-lg border border-ink-200 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="tutupModal"
                class="flex-1 px-4 py-2.5 rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-300 text-[13.5px] font-medium hover:bg-ink-50 dark:hover:bg-ink-700 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="formLoading"
                class="flex-1 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-[13.5px] font-semibold transition"
              >
                {{ formLoading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ===================== MODAL KONFIRMASI HAPUS ===================== -->
    <Teleport to="body">
      <div
        v-if="showConfirmHapus"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="tutupKonfirmasiHapus"
        ></div>

        <div class="relative w-full max-w-sm rounded-xl bg-white dark:bg-ink-800 shadow-2xl border border-ink-100 dark:border-ink-600 p-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <svg class="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h3 class="text-lg font-semibold text-ink-800 dark:text-white mb-2">
            Hapus Pengeluaran?
          </h3>
          <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mb-6">
            Pengeluaran
            <span class="font-medium text-ink-700 dark:text-ink-100">
              "{{ itemHapus?.deskripsi || itemHapus?.kategori }}"
            </span>
            akan dihapus permanen.
          </p>

          <div class="flex gap-3">
            <button
              type="button"
              @click="tutupKonfirmasiHapus"
              class="flex-1 px-4 py-2.5 rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-300 text-[13.5px] font-medium hover:bg-ink-50 dark:hover:bg-ink-700 transition"
            >
              Batal
            </button>
            <button
              type="button"
              @click="konfirmasiHapus"
              :disabled="hapusLoading"
              class="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[13.5px] font-semibold transition"
            >
              {{ hapusLoading ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===================== MODAL SUKSES ===================== -->
    <Teleport to="body">
      <div
        v-if="showSukses"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="tutupSukses"
        ></div>

        <div class="relative w-full max-w-sm rounded-xl bg-white dark:bg-ink-800 shadow-2xl border border-ink-100 dark:border-ink-600 p-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
            <svg class="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 class="text-lg font-semibold text-ink-800 dark:text-white mb-2">
            Berhasil!
          </h3>
          <p class="text-[13.5px] text-ink-500 dark:text-ink-300 mb-6">
            {{ pesanSukses }}
          </p>

          <button
            type="button"
            @click="tutupSukses"
            class="w-full px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[13.5px] font-semibold transition"
          >
            Oke
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStokPakan, SATUAN_PAKAN_OPTIONS } from '../composables/useStokPakan.js'
import NavIcon from '../components/NavIcon.vue'
// Catatan: ganti '../composables/useStokPakan.js' dan '../components/NavIcon.vue'
// sesuai struktur folder proyekmu. NavIcon dipakai untuk ikon warning/aksi;
// kalau nama ikon di bawah ('alert-triangle', 'plus', 'trash', 'pencil', 'package',
// 'arrow-down-circle', 'arrow-up-circle') belum ada di set ikonmu, sesuaikan
// dengan ikon yang tersedia.

const {
  jenisPakan,
  riwayat,
  riwayatHasMore,
  loadingJenis,
  loadingRiwayat,
  error,
  pakanMenipis,
  totalJenisPakan,
  muatJenisPakan,
  muatRiwayat,
  tambahJenisPakan,
  ubahJenisPakan,
  hapusJenisPakan,
  catatStokMasuk,
  catatStokKeluar
} = useStokPakan()

const todayStr = () => new Date().toISOString().slice(0, 10)

function formatSatuan(p) {
  return p.satuan === 'custom' ? p.satuanCustom : p.satuan
}

function formatRupiah(v) {
  if (v === null || v === undefined || v === '') return '-'
  return 'Rp' + Number(v).toLocaleString('id-ID')
}

function isMenipis(p) {
  return Number(p.stokSaatIni) <= Number(p.stokMinimum)
}

// ===================== Modal: Tambah / Edit Jenis Pakan =====================
const showModalJenis = ref(false)
const modeModalJenis = ref('tambah') // 'tambah' | 'edit'
const formJenis = ref({
  id: null,
  nama: '',
  merek: '',
  satuan: 'kg',
  satuanCustom: '',
  stokAwal: 0,
  stokMinimum: 0
})
const savingJenis = ref(false)
const errorJenis = ref('')

function bukaModalTambahJenis() {
  modeModalJenis.value = 'tambah'
  formJenis.value = { id: null, nama: '', merek: '', satuan: 'kg', satuanCustom: '', stokAwal: 0, stokMinimum: 0 }
  errorJenis.value = ''
  showModalJenis.value = true
}

function bukaModalEditJenis(p) {
  modeModalJenis.value = 'edit'
  formJenis.value = {
    id: p.id,
    nama: p.nama,
    merek: p.merek || '',
    satuan: p.satuan,
    satuanCustom: p.satuanCustom || '',
    stokAwal: p.stokSaatIni,
    stokMinimum: p.stokMinimum
  }
  errorJenis.value = ''
  showModalJenis.value = true
}

function tutupModalJenis() {
  showModalJenis.value = false
}

async function simpanJenis() {
  errorJenis.value = ''
  if (!formJenis.value.nama.trim()) {
    errorJenis.value = 'Nama pakan wajib diisi.'
    return
  }
  if (formJenis.value.satuan === 'custom' && !formJenis.value.satuanCustom.trim()) {
    errorJenis.value = 'Satuan kustom wajib diisi.'
    return
  }
  if (formJenis.value.stokMinimum < 0) {
    errorJenis.value = 'Stok minimum tidak boleh negatif.'
    return
  }

  savingJenis.value = true
  try {
    if (modeModalJenis.value === 'tambah') {
      await tambahJenisPakan({
        nama: formJenis.value.nama.trim(),
        merek: formJenis.value.merek.trim(),
        satuan: formJenis.value.satuan,
        satuanCustom: formJenis.value.satuanCustom.trim(),
        stokAwal: Number(formJenis.value.stokAwal) || 0,
        stokMinimum: Number(formJenis.value.stokMinimum) || 0
      })
    } else {
      await ubahJenisPakan(formJenis.value.id, {
        nama: formJenis.value.nama.trim(),
        merek: formJenis.value.merek.trim(),
        satuan: formJenis.value.satuan,
        satuanCustom: formJenis.value.satuanCustom.trim(),
        stokMinimum: Number(formJenis.value.stokMinimum) || 0
      })
    }
    showModalJenis.value = false
  } catch (err) {
    errorJenis.value = err.message
  } finally {
    savingJenis.value = false
  }
}

async function konfirmasiHapus(p) {
  if (!confirm(`Hapus jenis pakan "${p.nama}"? Riwayat transaksinya tidak akan terhapus.`)) return
  try {
    await hapusJenisPakan(p.id)
  } catch (err) {
    alert(err.message)
  }
}

// ===================== Modal: Catat Stok Masuk =====================
const showModalMasuk = ref(false)
const pakanTerpilihMasuk = ref(null)
const formMasuk = ref({ jumlah: '', tanggal: todayStr(), hargaSatuan: '', supplier: '', catatan: '' })
const savingMasuk = ref(false)
const errorMasuk = ref('')

function bukaModalMasuk(p) {
  pakanTerpilihMasuk.value = p
  formMasuk.value = { jumlah: '', tanggal: todayStr(), hargaSatuan: '', supplier: '', catatan: '' }
  errorMasuk.value = ''
  showModalMasuk.value = true
}

async function simpanMasuk() {
  errorMasuk.value = ''
  const jumlah = Number(formMasuk.value.jumlah)
  if (!jumlah || jumlah <= 0) {
    errorMasuk.value = 'Jumlah harus lebih dari 0.'
    return
  }
  savingMasuk.value = true
  try {
    await catatStokMasuk(pakanTerpilihMasuk.value.id, {
      jumlah,
      tanggal: formMasuk.value.tanggal,
      hargaSatuan: formMasuk.value.hargaSatuan ? Number(formMasuk.value.hargaSatuan) : null,
      supplier: formMasuk.value.supplier.trim(),
      catatan: formMasuk.value.catatan.trim()
    })
    showModalMasuk.value = false
  } catch (err) {
    errorMasuk.value = err.message
  } finally {
    savingMasuk.value = false
  }
}

// ===================== Modal: Catat Stok Keluar =====================
const showModalKeluar = ref(false)
const pakanTerpilihKeluar = ref(null)
const formKeluar = ref({ jumlah: '', tanggal: todayStr(), catatan: '' })
const savingKeluar = ref(false)
const errorKeluar = ref('')

function bukaModalKeluar(p) {
  pakanTerpilihKeluar.value = p
  formKeluar.value = { jumlah: '', tanggal: todayStr(), catatan: '' }
  errorKeluar.value = ''
  showModalKeluar.value = true
}

async function simpanKeluar() {
  errorKeluar.value = ''
  const jumlah = Number(formKeluar.value.jumlah)
  if (!jumlah || jumlah <= 0) {
    errorKeluar.value = 'Jumlah harus lebih dari 0.'
    return
  }
  if (jumlah > Number(pakanTerpilihKeluar.value.stokSaatIni)) {
    errorKeluar.value = `Stok tidak cukup. Sisa stok saat ini: ${pakanTerpilihKeluar.value.stokSaatIni} ${formatSatuan(pakanTerpilihKeluar.value)}.`
    return
  }
  savingKeluar.value = true
  try {
    await catatStokKeluar(pakanTerpilihKeluar.value.id, {
      jumlah,
      tanggal: formKeluar.value.tanggal,
      catatan: formKeluar.value.catatan.trim()
    })
    showModalKeluar.value = false
  } catch (err) {
    errorKeluar.value = err.message
  } finally {
    savingKeluar.value = false
  }
}

// ===================== Riwayat & filter =====================
const filterRiwayat = ref({ pakanId: '', tipe: '', dari: '', sampai: '' })

function terapkanFilterRiwayat() {
  muatRiwayat(filterRiwayat.value)
}

function resetFilterRiwayat() {
  filterRiwayat.value = { pakanId: '', tipe: '', dari: '', sampai: '' }
  muatRiwayat()
}

onMounted(() => {
  muatJenisPakan()
  muatRiwayat()
})
</script>

<template>
  <div class="w-full space-y-6">
    <!-- Header + ringkasan -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-[18px] font-semibold dark:text-white">Stok Pakan</h1>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300">Kelola stok, catat pembelian &amp; pemakaian pakan harian.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 transition shrink-0"
        @click="bukaModalTambahJenis"
      >
        <NavIcon name="plus" :size="16" />
        Tambah jenis pakan
      </button>
    </div>

    <!-- Kartu ringkasan -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12px] text-ink-400 dark:text-ink-300 mb-1">Jenis pakan terdaftar</p>
        <p class="text-[22px] font-semibold dark:text-white">{{ totalJenisPakan }}</p>
      </div>
      <div
        class="rounded-card border shadow-card p-4"
        :class="pakanMenipis.length > 0
          ? 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-700'
          : 'bg-white dark:bg-ink-700 border-ink-100 dark:border-ink-500'"
      >
        <p class="text-[12px] text-ink-400 dark:text-ink-300 mb-1">Stok menipis</p>
        <p class="text-[22px] font-semibold" :class="pakanMenipis.length > 0 ? 'text-danger-600' : 'dark:text-white'">
          {{ pakanMenipis.length }}
        </p>
      </div>
      <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-4">
        <p class="text-[12px] text-ink-400 dark:text-ink-300 mb-1">Transaksi tercatat</p>
        <p class="text-[22px] font-semibold dark:text-white">{{ riwayat.length }}</p>
      </div>
    </div>

    <!-- Alert stok menipis -->
    <div
      v-if="pakanMenipis.length > 0"
      class="rounded-card border border-danger-200 bg-danger-50 dark:bg-danger-900/20 dark:border-danger-700 p-4 flex gap-3"
    >
      <NavIcon name="alert-triangle" :size="18" class="text-danger-600 shrink-0 mt-0.5" />
      <div class="text-[13px]">
        <p class="font-medium text-danger-700 dark:text-danger-400 mb-1">Ada {{ pakanMenipis.length }} jenis pakan yang stoknya menipis:</p>
        <ul class="list-disc list-inside text-danger-600 dark:text-danger-400 space-y-0.5">
          <li v-for="p in pakanMenipis" :key="p.id">
            {{ p.nama }} — sisa {{ p.stokSaatIni }} {{ formatSatuan(p) }} (batas minimum {{ p.stokMinimum }} {{ formatSatuan(p) }})
          </li>
        </ul>
      </div>
    </div>

    <p v-if="error" class="text-[13px] text-danger-600">{{ error }}</p>

    <!-- Tabel jenis pakan -->
    <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold dark:text-white mb-4">Daftar jenis pakan</h2>

      <div v-if="loadingJenis" class="text-[13px] text-ink-400 py-6 text-center">Memuat data...</div>
      <div v-else-if="jenisPakan.length === 0" class="text-[13px] text-ink-400 py-6 text-center">
        Belum ada jenis pakan. Klik "Tambah jenis pakan" untuk mulai.
      </div>

      <div v-else class="overflow-x-auto -mx-5">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[11.5px] uppercase tracking-wide text-ink-400 dark:text-ink-300 border-b border-ink-100 dark:border-ink-500">
              <th class="px-5 py-2 font-medium">Nama pakan</th>
              <th class="px-5 py-2 font-medium">Merek</th>
              <th class="px-5 py-2 font-medium">Stok saat ini</th>
              <th class="px-5 py-2 font-medium">Stok minimum</th>
              <th class="px-5 py-2 font-medium">Status</th>
              <th class="px-5 py-2 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100 dark:divide-ink-500">
            <tr v-for="p in jenisPakan" :key="p.id" class="text-[13.5px] dark:text-ink-100">
              <td class="px-5 py-3 font-medium">{{ p.nama }}</td>
              <td class="px-5 py-3 text-ink-400 dark:text-ink-300">{{ p.merek || '-' }}</td>
              <td class="px-5 py-3">{{ p.stokSaatIni }} {{ formatSatuan(p) }}</td>
              <td class="px-5 py-3 text-ink-400 dark:text-ink-300">{{ p.stokMinimum }} {{ formatSatuan(p) }}</td>
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
                  :class="isMenipis(p) ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-400' : 'bg-ok-100 text-ok-700 dark:bg-ok-900/30 dark:text-ok-400'"
                >
                  {{ isMenipis(p) ? 'Menipis' : 'Aman' }}
                </span>
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    title="Catat stok masuk"
                    class="p-1.5 rounded-lg text-ok-600 hover:bg-ok-50 dark:hover:bg-ok-900/20 transition"
                    @click="bukaModalMasuk(p)"
                  >
                    <NavIcon name="arrow-down-circle" :size="17" />
                  </button>
                  <button
                    type="button"
                    title="Catat stok keluar"
                    class="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
                    @click="bukaModalKeluar(p)"
                  >
                    <NavIcon name="arrow-up-circle" :size="17" />
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    class="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-600 transition"
                    @click="bukaModalEditJenis(p)"
                  >
                    <NavIcon name="pencil" :size="17" />
                  </button>
                  <button
                    type="button"
                    title="Hapus"
                    class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition"
                    @click="konfirmasiHapus(p)"
                  >
                    <NavIcon name="trash" :size="17" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Riwayat transaksi -->
    <section class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card p-5">
      <h2 class="text-[15px] font-semibold dark:text-white mb-1">Riwayat transaksi pakan</h2>
      <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">Histori stok masuk &amp; keluar untuk semua jenis pakan.</p>

      <!-- Filter -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <select
          v-model="filterRiwayat.pakanId"
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13px]"
        >
          <option value="">Semua jenis pakan</option>
          <option v-for="p in jenisPakan" :key="p.id" :value="p.id">{{ p.nama }}</option>
        </select>
        <select
          v-model="filterRiwayat.tipe"
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13px]"
        >
          <option value="">Semua tipe</option>
          <option value="masuk">Stok masuk</option>
          <option value="keluar">Stok keluar</option>
        </select>
        <input
          v-model="filterRiwayat.dari"
          type="date"
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13px]"
        />
        <input
          v-model="filterRiwayat.sampai"
          type="date"
          class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2 text-[13px]"
        />
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-brand-500 text-white px-3 py-2 text-[13px] font-medium hover:bg-brand-600 transition"
            @click="terapkanFilterRiwayat"
          >
            Terapkan
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 px-3 py-2 text-[13px] font-medium hover:bg-ink-100 dark:hover:bg-ink-600 transition"
            @click="resetFilterRiwayat"
          >
            Reset
          </button>
        </div>
      </div>

      <div v-if="loadingRiwayat" class="text-[13px] text-ink-400 py-6 text-center">Memuat riwayat...</div>
      <div v-else-if="riwayat.length === 0" class="text-[13px] text-ink-400 py-6 text-center">
        Belum ada riwayat transaksi.
      </div>

      <div v-else class="overflow-x-auto -mx-5">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[11.5px] uppercase tracking-wide text-ink-400 dark:text-ink-300 border-b border-ink-100 dark:border-ink-500">
              <th class="px-5 py-2 font-medium">Tanggal</th>
              <th class="px-5 py-2 font-medium">Jenis pakan</th>
              <th class="px-5 py-2 font-medium">Tipe</th>
              <th class="px-5 py-2 font-medium">Jumlah</th>
              <th class="px-5 py-2 font-medium">Harga / Supplier</th>
              <th class="px-5 py-2 font-medium">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100 dark:divide-ink-500">
            <tr v-for="t in riwayat" :key="t.id" class="text-[13.5px] dark:text-ink-100">
              <td class="px-5 py-3 whitespace-nowrap">{{ t.tanggal }}</td>
              <td class="px-5 py-3">{{ t.namaPakan }}</td>
              <td class="px-5 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-medium"
                  :class="t.tipe === 'masuk' ? 'bg-ok-100 text-ok-700 dark:bg-ok-900/30 dark:text-ok-400' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'"
                >
                  {{ t.tipe === 'masuk' ? 'Masuk' : 'Keluar' }}
                </span>
              </td>
              <td class="px-5 py-3">{{ t.jumlah }} {{ t.satuan }}</td>
              <td class="px-5 py-3 text-ink-400 dark:text-ink-300">
                <span v-if="t.tipe === 'masuk'">{{ formatRupiah(t.hargaSatuan) }}<span v-if="t.supplier"> · {{ t.supplier }}</span></span>
                <span v-else>-</span>
              </td>
              <td class="px-5 py-3 text-ink-400 dark:text-ink-300">{{ t.catatan || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="riwayatHasMore" class="text-center mt-4">
        <button
          type="button"
          class="text-[13px] font-medium text-brand-600 hover:text-brand-700"
          @click="muatRiwayat({ ...filterRiwayat, offset: riwayat.length })"
        >
          Muat lebih banyak
        </button>
      </div>
    </section>

    <!-- ===================== Modal Tambah/Edit Jenis Pakan ===================== -->
    <div v-if="showModalJenis" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="tutupModalJenis">
      <div class="bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h3 class="text-[15px] font-semibold dark:text-white mb-4">
          {{ modeModalJenis === 'tambah' ? 'Tambah jenis pakan' : 'Edit jenis pakan' }}
        </h3>

        <div class="space-y-3">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama pakan</label>
            <input
              v-model="formJenis.nama"
              type="text"
              placeholder="Contoh: Pelet apung 781-2"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Merek (opsional)</label>
            <input
              v-model="formJenis.merek"
              type="text"
              placeholder="Contoh: Comfeed, Hi-Provite"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Satuan</label>
              <select
                v-model="formJenis.satuan"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              >
                <option v-for="s in SATUAN_PAKAN_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
            <div v-if="formJenis.satuan === 'custom'">
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama satuan</label>
              <input
                v-model="formJenis.satuanCustom"
                type="text"
                placeholder="Contoh: drum"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div v-if="modeModalJenis === 'tambah'">
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Stok awal</label>
              <input
                v-model="formJenis.stokAwal"
                type="number"
                min="0"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Batas stok minimum</label>
              <input
                v-model="formJenis.stokMinimum"
                type="number"
                min="0"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
              <p class="text-[11.5px] text-ink-400 mt-1">Notifikasi "stok menipis" muncul di bawah angka ini.</p>
            </div>
          </div>

          <p v-if="modeModalJenis === 'edit'" class="text-[11.5px] text-ink-400">
            Untuk mengubah jumlah stok saat ini, gunakan tombol "Catat stok masuk" / "Catat stok keluar" di tabel, bukan lewat form ini.
          </p>

          <p v-if="errorJenis" class="text-[13px] text-danger-600">{{ errorJenis }}</p>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            :disabled="savingJenis"
            class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
            @click="simpanJenis"
          >
            {{ savingJenis ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 px-4 py-2.5 text-[13.5px] font-medium hover:bg-ink-100 dark:hover:bg-ink-600 transition"
            @click="tutupModalJenis"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== Modal Catat Stok Masuk ===================== -->
    <div v-if="showModalMasuk" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showModalMasuk = false">
      <div class="bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h3 class="text-[15px] font-semibold dark:text-white mb-1">Catat stok masuk</h3>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">
          {{ pakanTerpilihMasuk?.nama }} — stok saat ini: {{ pakanTerpilihMasuk?.stokSaatIni }} {{ pakanTerpilihMasuk && formatSatuan(pakanTerpilihMasuk) }}
        </p>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah masuk</label>
              <input
                v-model="formMasuk.jumlah"
                type="number"
                min="0"
                step="any"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
              <input
                v-model="formMasuk.tanggal"
                type="date"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Harga per satuan (opsional)</label>
              <input
                v-model="formMasuk.hargaSatuan"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Supplier (opsional)</label>
              <input
                v-model="formMasuk.supplier"
                type="text"
                placeholder="Contoh: Toko Tani Makmur"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea
              v-model="formMasuk.catatan"
              rows="2"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] resize-none"
            ></textarea>
          </div>

          <p v-if="errorMasuk" class="text-[13px] text-danger-600">{{ errorMasuk }}</p>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            :disabled="savingMasuk"
            class="rounded-lg bg-ok-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-ok-600 disabled:opacity-60"
            @click="simpanMasuk"
          >
            {{ savingMasuk ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 px-4 py-2.5 text-[13.5px] font-medium hover:bg-ink-100 dark:hover:bg-ink-600 transition"
            @click="showModalMasuk = false"
          >
            Batal
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== Modal Catat Stok Keluar ===================== -->
    <div v-if="showModalKeluar" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="showModalKeluar = false">
      <div class="bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <h3 class="text-[15px] font-semibold dark:text-white mb-1">Catat stok keluar</h3>
        <p class="text-[12.5px] text-ink-400 dark:text-ink-300 mb-4">
          {{ pakanTerpilihKeluar?.nama }} — stok saat ini: {{ pakanTerpilihKeluar?.stokSaatIni }} {{ pakanTerpilihKeluar && formatSatuan(pakanTerpilihKeluar) }}
        </p>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah keluar</label>
              <input
                v-model="formKeluar.jumlah"
                type="number"
                min="0"
                step="any"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
              <input
                v-model="formKeluar.tanggal"
                type="date"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
          </div>

          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea
              v-model="formKeluar.catatan"
              rows="2"
              placeholder="Contoh: dipakai untuk pemberian pakan Kolam 3"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px] resize-none"
            ></textarea>
          </div>

          <p v-if="errorKeluar" class="text-[13px] text-danger-600">{{ errorKeluar }}</p>
        </div>

        <div class="flex items-center gap-3 pt-4">
          <button
            type="button"
            :disabled="savingKeluar"
            class="rounded-lg bg-brand-500 text-white px-4 py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
            @click="simpanKeluar"
          >
            {{ savingKeluar ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-ink-200 dark:border-ink-500 text-ink-600 dark:text-ink-200 px-4 py-2.5 text-[13.5px] font-medium hover:bg-ink-100 dark:hover:bg-ink-600 transition"
            @click="showModalKeluar = false"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
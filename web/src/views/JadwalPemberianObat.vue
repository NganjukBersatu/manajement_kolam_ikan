<script setup>
import { ref, onMounted, computed } from 'vue'

const daftarKolam = ref([])
const riwayatObat = ref([])
const jadwalObat = ref([])

const isLoading = ref(false)
const isSaving = ref(false)

const showForm = ref(false)
const kolamDipilih = ref(null)
const jadwalDipilih = ref(null)
const form = ref({
  tanggal: new Date().toISOString().slice(0, 10),
  nama_obat: '',
  dosis: '',
  biaya: '',
  catatan: '',
  buat_jadwal_berikutnya: true,
  interval_hari: 14
})

const showRiwayat = ref(false)
const riwayatKolamDipilih = ref(null)

// Form Tambah / Edit Jadwal
const showJadwalForm = ref(false)
const modeJadwal = ref('tambah') // 'tambah' | 'edit'
const jadwalForm = ref({
  id: null,
  kolam_id: '',
  tanggal_jadwal: new Date().toISOString().slice(0, 10),
  catatan: ''
})

const filterStatus = ref('semua') // semua | terlambat | jatuh_tempo | mendatang | belum_ada

const toast = ref({ show: false, message: '', type: 'success' })

const hariIni = new Date().toISOString().slice(0, 10)

const kolamAktif = computed(() => daftarKolam.value.filter(k => k.status === 'aktif'))

const daftarGabungan = computed(() => {
  return kolamAktif.value.map(k => {
    const riwayatKolam = riwayatObat.value
      .filter(r => r.kolam_id === k.id)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    const terakhir = riwayatKolam[0] || null

    const jadwalKolam = jadwalObat.value
      .filter(j => j.kolam_id === k.id && j.status === 'belum')
      .sort((a, b) => new Date(a.tanggal_jadwal) - new Date(b.tanggal_jadwal))
    const jadwalTerdekat = jadwalKolam[0] || null

    let statusJadwal = null
    if (jadwalTerdekat) {
      if (jadwalTerdekat.tanggal_jadwal < hariIni) statusJadwal = 'terlambat'
      else if (jadwalTerdekat.tanggal_jadwal === hariIni) statusJadwal = 'jatuh_tempo'
      else statusJadwal = 'mendatang'
    }

    return {
      ...k,
      tanggal_terakhir: terakhir?.tanggal || null,
      obat_terakhir: terakhir?.nama_obat || null,
      riwayat: riwayatKolam,
      jadwal_terdekat: jadwalTerdekat,
      status_jadwal: statusJadwal
    }
  })
})

const daftarTampil = computed(() => {
  if (filterStatus.value === 'semua') return daftarGabungan.value
  if (filterStatus.value === 'belum_ada') {
    return daftarGabungan.value.filter(k => !k.jadwal_terdekat)
  }
  return daftarGabungan.value.filter(k => k.status_jadwal === filterStatus.value)
})

function tambahHari(tanggalStr, jumlahHari) {
  const d = new Date(tanggalStr + 'T00:00:00')
  d.setDate(d.getDate() + Number(jumlahHari))
  return d.toISOString().slice(0, 10)
}

function tampilkanToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

async function muatKolam() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  daftarKolam.value = json.data || []
}

async function muatRiwayat() {
  const res = await fetch('/api/obat')
  const json = await res.json()
  riwayatObat.value = json.data || []
}

async function muatJadwal() {
  const res = await fetch('/api/jadwal?jenis=obat')
  const json = await res.json()
  jadwalObat.value = json.data || []
}

async function muatSemua() {
  isLoading.value = true
  try {
    await Promise.all([muatKolam(), muatRiwayat(), muatJadwal()])
  } finally {
    isLoading.value = false
  }
}

function bukaForm(k) {
  kolamDipilih.value = k
  jadwalDipilih.value = k.jadwal_terdekat
  form.value = {
    tanggal: k.jadwal_terdekat ? k.jadwal_terdekat.tanggal_jadwal : new Date().toISOString().slice(0, 10),
    nama_obat: '',
    dosis: '',
    biaya: '',
    catatan: '',
    buat_jadwal_berikutnya: true,
    interval_hari: 14
  }
  showForm.value = true
}

async function simpan() {
  isSaving.value = true
  try {
    // 1. Simpan pemberian obat
    const res = await fetch('/api/obat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kolam_id: kolamDipilih.value.id,
        tanggal: form.value.tanggal,
        nama_obat: form.value.nama_obat,
        dosis: form.value.dosis,
        biaya: form.value.biaya || 0,
        catatan: form.value.catatan,
        jadwal_id: jadwalDipilih.value?.id || null
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      tampilkanToast(err.message || 'Gagal menyimpan pemberian obat', 'error')
      return
    }

    // 2. Buat jadwal berikutnya (jika dicentang)
    if (form.value.buat_jadwal_berikutnya && Number(form.value.interval_hari) > 0) {
      const tanggalBerikutnya = tambahHari(form.value.tanggal, form.value.interval_hari)

      try {
        const resJadwal = await fetch('/api/jadwal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tebar_id: kolamDipilih.value.tebar_id,
            kolam_id: kolamDipilih.value.id,
            jenis: 'obat',
            tanggal_jadwal: tanggalBerikutnya,
            status: 'belum',
            catatan: form.value.nama_obat ? `Lanjutan dari ${form.value.nama_obat}` : null
          })
        })

        if (!resJadwal.ok) {
          const err = await resJadwal.json().catch(() => ({}))
          tampilkanToast(
            'Obat berhasil dicatat, tapi gagal buat jadwal berikutnya: ' + (err.message || err.error || resJadwal.status),
            'error'
          )
        }
      } catch (e) {
        tampilkanToast('Obat berhasil dicatat, tapi gagal buat jadwal berikutnya (network)', 'error')
      }
    }

    showForm.value = false
    await muatSemua()
    tampilkanToast('Pemberian obat berhasil dicatat')
  } finally {
    isSaving.value = false
  }
}

function bukaRiwayat(k) {
  riwayatKolamDipilih.value = k
  showRiwayat.value = true
}

// ===== Tambah / Edit Jadwal =====
function bukaTambahJadwal() {
  modeJadwal.value = 'tambah'
  jadwalForm.value = {
    id: null,
    kolam_id: kolamAktif.value[0]?.id || '',
    tanggal_jadwal: new Date().toISOString().slice(0, 10),
    catatan: ''
  }
  showJadwalForm.value = true
}

function bukaEditJadwal(k) {
  if (!k.jadwal_terdekat) return
  modeJadwal.value = 'edit'
  jadwalForm.value = {
    id: k.jadwal_terdekat.id,
    kolam_id: k.id,
    tanggal_jadwal: k.jadwal_terdekat.tanggal_jadwal,
    catatan: k.jadwal_terdekat.catatan || ''
  }
  showJadwalForm.value = true
}

async function simpanJadwal() {
  isSaving.value = true
  try {
    const kolam = daftarKolam.value.find(k => k.id == jadwalForm.value.kolam_id)

    const payload = {
      tebar_id: Number(kolam?.tebar_id),
      kolam_id: Number(jadwalForm.value.kolam_id),
      jenis: 'obat',
      tanggal_jadwal: jadwalForm.value.tanggal_jadwal,
      status: 'belum',
      catatan: jadwalForm.value.catatan || null
    }

    let res
    if (modeJadwal.value === 'edit') {
      res = await fetch(`/api/jadwal/${jadwalForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      tampilkanToast(err.message || 'Gagal menyimpan jadwal', 'error')
      return
    }

    showJadwalForm.value = false
    await muatSemua()
    tampilkanToast(modeJadwal.value === 'edit' ? 'Jadwal berhasil diubah' : 'Jadwal berhasil ditambahkan')
  } finally {
    isSaving.value = false
  }
}

async function hapusJadwal(k) {
  if (!k.jadwal_terdekat) return
  if (!confirm(`Hapus jadwal ${tanggal(k.jadwal_terdekat.tanggal_jadwal)} untuk ${k.nama_kolam}?`)) return

  isSaving.value = true
  try {
    const res = await fetch(`/api/jadwal/${k.jadwal_terdekat.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      tampilkanToast(err.message || 'Gagal menghapus jadwal', 'error')
      return
    }
    await muatSemua()
    tampilkanToast('Jadwal berhasil dihapus')
  } finally {
    isSaving.value = false
  }
}

function rupiah(n) {
  return n ? Number(n).toLocaleString('id-ID') : '-'
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function labelStatusJadwal(status) {
  if (status === 'terlambat') return 'Terlambat'
  if (status === 'jatuh_tempo') return 'Jatuh tempo hari ini'
  if (status === 'mendatang') return 'Terjadwal'
  return 'Belum ada jadwal'
}

onMounted(() => {
  muatSemua()
})

const showFilter = ref(false)

const opsiFilter = [
  { value: 'semua', label: 'Semua' },
  { value: 'terlambat', label: 'Terlambat' },
  { value: 'jatuh_tempo', label: 'Jatuh tempo hari ini' },
  { value: 'mendatang', label: 'Mendatang' },
  { value: 'belum_ada', label: 'Belum ada jadwal' }
]

const labelFilter = computed(() => {
  return opsiFilter.find(o => o.value === filterStatus.value)?.label || 'Semua'
})

function pilihFilter(value) {
  filterStatus.value = value
  showFilter.value = false
}

// Tutup dropdown kalau klik di luar
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    showFilter.value = false
  }
}

onMounted(() => {
  muatSemua()
  document.addEventListener('click', handleClickOutside)
})

// Jangan lupa hapus listener kalau component unmount (opsional)
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

</script>

<template>
  <div class="space-y-4">
    <!-- Toast -->
    <div
      v-if="toast.show"
      class="fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all"
      :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
    >
      {{ toast.message }}
    </div>

<!-- Header + Filter + Tambah -->
<div class="flex flex-wrap items-center justify-between gap-3">
  <div class="flex items-center gap-2">
    <label class="text-[13px] text-ink-500 dark:text-ink-300">Filter:</label>
    
    <!-- Custom Filter Dropdown -->
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-800 text-[13px] font-medium dark:text-ink-100 hover:bg-ink-50 dark:hover:bg-ink-700 transition"
        @click="showFilter = !showFilter"
      >
        <span>{{ labelFilter }}</span>
        <svg class="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
<div
  v-if="showFilter"
  class="absolute left-0 mt-1 w-52 rounded-lg border border-ink-100 dark:border-ink-500 bg-white dark:bg-ink-800 shadow-lg z-20 overflow-hidden"
>
  <button
    v-for="opt in opsiFilter"
    :key="opt.value"
    type="button"
    class="w-full text-left px-3 py-2.5 text-[13px] transition"
    :class="filterStatus === opt.value
      ? 'bg-brand-500 text-white font-semibold'
      : 'dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-700'"
    @click="pilihFilter(opt.value)"
  >
    {{ opt.label }}
  </button>
</div>
    </div>
  </div>

  <button
    type="button"
    class="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-semibold"
    @click="bukaTambahJadwal"
  >
    + Tambah Jadwal
  </button>
</div>      

    <!-- Tabel -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden relative">
      <div v-if="isLoading" class="absolute inset-0 bg-white/60 dark:bg-ink-900/60 flex items-center justify-center z-10">
        <span class="text-[13px] text-ink-500 dark:text-ink-300">Memuat data...</span>
      </div>

      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Terakhir Diberi Obat</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jadwal Berikutnya</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="k in daftarTampil"
            :key="k.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3 font-semibold">{{ k.nama_kolam }}</td>
            <td class="px-4 py-3">{{ k.nama_ikan || '-' }}</td>
            <td class="px-4 py-3">{{ rupiah(k.jumlah_saat_ini) }}</td>
            <td class="px-4 py-3">
              <span v-if="k.tanggal_terakhir">
                {{ tanggal(k.tanggal_terakhir) }}
                <span class="text-ink-400 dark:text-ink-300"> · {{ k.obat_terakhir }}</span>
              </span>
              <span v-else class="text-ink-400 dark:text-ink-300">Belum pernah</span>
            </td>
            <td class="px-4 py-3">
              <div v-if="k.jadwal_terdekat" class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-[12.5px]">{{ tanggal(k.jadwal_terdekat.tanggal_jadwal) }}</span>
                  <button
                    type="button"
                    class="text-[11px] text-brand-500 hover:underline"
                    @click="bukaEditJadwal(k)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="text-[11px] text-red-500 hover:underline"
                    @click="hapusJadwal(k)"
                  >
                    Hapus
                  </button>
                </div>
                <span
                  class="inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  :class="{
                    'bg-red-100 text-red-600 dark:bg-red-600/25 dark:text-red-400': k.status_jadwal === 'terlambat',
                    'bg-warn-100 text-warn-600 dark:bg-warn-600/25 dark:text-warn-500': k.status_jadwal === 'jatuh_tempo',
                    'bg-ink-100 text-ink-500 dark:bg-ink-600 dark:text-ink-300': k.status_jadwal === 'mendatang'
                  }"
                >
                  {{ labelStatusJadwal(k.status_jadwal) }}
                </span>
              </div>
              <span v-else class="text-ink-400 dark:text-ink-300 text-[12.5px]">Tidak ada jadwal</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2 flex-wrap">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 text-[12.5px] font-semibold whitespace-nowrap"
                  @click="bukaRiwayat(k)"
                >
                  Lihat riwayat
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg text-white text-[12.5px] font-semibold whitespace-nowrap"
                  :class="k.status_jadwal === 'terlambat' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-brand-500 hover:bg-brand-600'"
                  @click="bukaForm(k)"
                >
                  Catat Obat
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!isLoading && daftarTampil.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              Tidak ada data yang sesuai filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal: Catat Pemberian Obat -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-1">
          Catat Pemberian Obat — {{ kolamDipilih?.nama_kolam }}
        </h2>
        <p v-if="jadwalDipilih" class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-4">
          Sesuai jadwal {{ tanggal(jadwalDipilih.tanggal_jadwal) }}
        </p>
        <p v-else class="text-[12.5px] text-ink-500 dark:text-ink-300 mb-4">
          Tidak terkait jadwal (pencatatan manual)
        </p>

        <form class="space-y-3" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Nama Obat</label>
            <input v-model="form.nama_obat" type="text" required placeholder="Contoh: Anti Jamur X" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Dosis</label>
            <input v-model="form.dosis" type="text" placeholder="Contoh: 5ml / 100L air" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">
              Biaya (Rp) <span class="text-ink-400 font-normal">(opsional)</span>
            </label>
            <input v-model="form.biaya" type="number" min="0" placeholder="Contoh: 25000" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea v-model="form.catatan" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"></textarea>
          </div>

          <div class="border-t border-ink-100 dark:border-ink-500 pt-3">
            <label class="flex items-center gap-2 text-[13px] font-medium dark:text-ink-300">
              <input v-model="form.buat_jadwal_berikutnya" type="checkbox" class="rounded" />
              Buat jadwal obat berikutnya otomatis
            </label>
            <div v-if="form.buat_jadwal_berikutnya" class="mt-2 flex items-center gap-2">
              <span class="text-[12.5px] text-ink-500 dark:text-ink-300">Ulangi setelah</span>
              <input
                v-model="form.interval_hari"
                type="number"
                min="1"
                class="w-20 rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-2 py-1.5 text-[13px]"
              />
              <span class="text-[12.5px] text-ink-500 dark:text-ink-300">hari</span>
            </div>
            <p v-if="form.buat_jadwal_berikutnya" class="text-[11.5px] text-ink-400 dark:text-ink-300 mt-1">
              Jadwal berikutnya: {{ tanggal(tambahHari(form.tanggal, form.interval_hari || 0)) }}
            </p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Tambah / Edit Jadwal -->
    <div v-if="showJadwalForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showJadwalForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">
          {{ modeJadwal === 'edit' ? 'Edit Jadwal Obat' : 'Tambah Jadwal Obat' }}
        </h2>

        <form class="space-y-3" @submit.prevent="simpanJadwal">
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam</label>
            <select
              v-model="jadwalForm.kolam_id"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              :disabled="modeJadwal === 'edit'"
            >
              <option v-for="k in kolamAktif" :key="k.id" :value="k.id">
                {{ k.nama_kolam }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal Jadwal</label>
            <input
              v-model="jadwalForm.tanggal_jadwal"
              type="date"
              required
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
            <textarea
              v-model="jadwalForm.catatan"
              class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              placeholder="Contoh: Booster / Anti jamur"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showJadwalForm = false">
              Batal
            </button>
            <button
              type="submit"
              class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Riwayat -->
    <div v-if="showRiwayat" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showRiwayat = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto">
        <h2 class="text-[16px] font-semibold dark:text-white mb-4">
          Riwayat Pemberian Obat — {{ riwayatKolamDipilih?.nama_kolam }}
        </h2>
        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="border-b border-ink-100 dark:border-ink-500 text-ink-500 dark:text-ink-300">
              <th class="py-2 pr-2">Tanggal</th>
              <th class="py-2 pr-2">Obat</th>
              <th class="py-2 pr-2">Dosis</th>
              <th class="py-2">Biaya</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in daftarGabungan.find(k => k.id === riwayatKolamDipilih?.id)?.riwayat || []"
              :key="r.id"
              class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
            >
              <td class="py-2 pr-2">{{ tanggal(r.tanggal) }}</td>
              <td class="py-2 pr-2">{{ r.nama_obat }}</td>
              <td class="py-2 pr-2">{{ r.dosis || '-' }}</td>
              <td class="py-2">Rp {{ rupiah(r.biaya) }}</td>
            </tr>
            <tr v-if="!(daftarGabungan.find(k => k.id === riwayatKolamDipilih?.id)?.riwayat?.length)">
              <td colspan="4" class="py-4 text-center text-ink-500 dark:text-ink-300">Belum ada riwayat.</td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="mt-4 w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showRiwayat = false">
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
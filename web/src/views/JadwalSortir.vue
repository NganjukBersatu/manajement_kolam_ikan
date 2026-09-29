<script setup>
import { ref, onMounted } from 'vue'

// Tanggal hari ini dalam waktu lokal, format 'YYYY-MM-DD'
function hariIniLokal() {
  const x = new Date()
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

const daftar = ref([])
const isSaving = ref(false)
const showForm = ref(false)
const jadwalDipilih = ref(null)
const form = ref({
  tanggal: hariIniLokal(),
  jumlah_mati: '',
  catatan: '',
  sortir_ke: 1
})

const toast = ref({ show: false, message: '', type: 'success' })

function tampilkanToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3500)
}

async function muat() {
  try {
    const res = await fetch('/api/jadwal?jenis=sortir')
    const json = await res.json()
    daftar.value = json.data || []
  } catch (e) {
    console.error('Gagal memuat jadwal sortir:', e)
    tampilkanToast('Gagal memuat jadwal sortir', 'error')
  }
}

function bukaForm(j) {
  jadwalDipilih.value = j
  // Hitung sortir ke berapa (mulai dari 1)
  const ke = (j.jumlah_sortir || 0) + 1
  form.value = {
    tanggal: hariIniLokal(),
    jumlah_mati: '',
    catatan: '',
    sortir_ke: ke
  }
  showForm.value = true
}

async function simpan() {
  isSaving.value = true
  try {
    const payload = {
      jadwal_id: jadwalDipilih.value.id,
      tebar_id: jadwalDipilih.value.tebar_id,
      kolam_id: jadwalDipilih.value.kolam_id,
      sortir_ke: form.value.sortir_ke,
      tanggal: form.value.tanggal,
      jumlah_mati: Number(form.value.jumlah_mati),
      catatan: form.value.catatan || null
    }

    const res = await fetch('/api/sortir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('POST sortir gagal:', res.status, err, payload)
      tampilkanToast(
        (err.message || err.error || 'Gagal menyimpan sortir') + ` (${res.status})`,
        'error'
      )
      return // modal tetap terbuka supaya data yang sudah diisi tidak hilang
    }

    showForm.value = false
    await muat()
    tampilkanToast(`Sortir ke-${payload.sortir_ke} berhasil dicatat`)
  } catch (e) {
    console.error('Error jaringan saat simpan sortir:', e)
    tampilkanToast('Gagal menyimpan sortir (masalah jaringan)', 'error')
  } finally {
    isSaving.value = false
  }
}

function tanggal(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Cek apakah jadwal sortir sudah lewat tanggal dan belum pernah disortir
function isTerlambat(j) {
  if (j.jumlah_sortir > 0) return false
  const hariIni = new Date()
  hariIni.setHours(0, 0, 0, 0)
  const jadwal = new Date(j.tanggal_jadwal)
  jadwal.setHours(0, 0, 0, 0)
  return jadwal < hariIni
}

// Label status: Sudah pernah / Terlambat / Belum
function labelStatus(j) {
  if (j.jumlah_sortir > 0) return 'Sudah pernah'
  if (isTerlambat(j)) return 'Terlambat'
  return 'Belum'
}

// Class badge sesuai status
function classStatus(j) {
  if (j.jumlah_sortir > 0) {
    return 'bg-ok-100 text-ok-600 dark:bg-ok-600/25 dark:text-ok-500'
  }
  if (isTerlambat(j)) {
    return 'bg-danger-100 text-danger-600 dark:bg-danger-600/25 dark:text-danger-500'
  }
  return 'bg-warn-100 text-warn-600 dark:bg-warn-600/25 dark:text-warn-500'
}

onMounted(muat)
</script>

<template>
  <!-- Toast -->
  <div
    v-if="toast.show"
    class="fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all"
    :class="toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
  >
    {{ toast.message }}
  </div>

  <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Jadwal</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Sortir</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
          <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="j in daftar"
          :key="j.id"
          class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
        >
          <td class="px-4 py-3 font-semibold">{{ j.nama_kolam }}</td>
          <td class="px-4 py-3">{{ j.nama_ikan }}</td>
          <td class="px-4 py-3">{{ j.jumlah_saat_ini }}</td>
          <td class="px-4 py-3">
            {{ tanggal(j.tanggal_jadwal) }}
            <span
              v-if="isTerlambat(j)"
              class="ml-1 text-danger-600 dark:text-danger-500 text-[11.5px] font-semibold"
            >
              (lewat jadwal)
            </span>
          </td>
          <td class="px-4 py-3">
            <span class="font-medium">
              {{ j.jumlah_sortir || 0 }}×
            </span>
            <span v-if="j.jumlah_sortir > 0" class="text-ink-500 dark:text-ink-300 text-[12px] ml-1">
              (terakhir ke-{{ j.jumlah_sortir }})
            </span>
          </td>
          <td class="px-4 py-3">
            <span
              class="px-2 py-1 rounded-full text-[11.5px] font-semibold"
              :class="classStatus(j)"
            >
              {{ labelStatus(j) }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <!-- Tombol selalu muncul, tidak dihilangkan -->
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600"
              @click="bukaForm(j)"
            >
              Catat Sortir
            </button>
          </td>
        </tr>
        <tr v-if="daftar.length === 0">
          <td colspan="7" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada jadwal sortir.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal Form -->
  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-1">
        Catat Sortir — {{ jadwalDipilih?.nama_kolam }}
      </h2>
      <p class="text-[13px] text-brand-500 font-semibold mb-4">
        Sortir ke-{{ form.sortir_ke }}
      </p>

      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
          <input
            v-model="form.tanggal"
            type="date"
            required
            class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
          />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah Ikan Mati</label>
          <input
            v-model="form.jumlah_mati"
            type="number"
            min="0"
            required
            class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
          />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
          <textarea
            v-model="form.catatan"
            class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
            placeholder="Misal: ukuran tidak seragam, ada yang sakit, dll."
          ></textarea>
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
            class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600 disabled:opacity-60"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Menyimpan...' : `Simpan Sortir ke-${form.sortir_ke}` }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
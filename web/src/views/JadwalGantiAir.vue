<script setup>
import { ref, onMounted } from 'vue'

const daftar = ref([])
const daftarKolamAktif = ref([])

const showForm = ref(false)
const jadwalDipilih = ref(null)
const form = ref({ tanggal: new Date().toISOString().slice(0, 10), persentase_air: '', catatan: '' })

const showTambahJadwal = ref(false)
const formJadwalBaru = ref({ kolam_id: '', tanggal_jadwal: new Date().toISOString().slice(0, 10) })

async function muat() {
  const res = await fetch('/api/jadwal?jenis=ganti_air')
  const json = await res.json()
  daftar.value = json.data
}

async function muatKolamAktif() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  // Hanya kolam yang sedang punya tebar aktif (tebar_id tidak null)
  daftarKolamAktif.value = json.data.filter(k => k.tebar_id)
}

function bukaForm(j) {
  jadwalDipilih.value = j
  form.value = { tanggal: new Date().toISOString().slice(0, 10), persentase_air: '', catatan: '' }
  showForm.value = true
}

async function simpan() {
  await fetch('/api/ganti-air', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jadwal_id: jadwalDipilih.value.id,
      tebar_id: jadwalDipilih.value.tebar_id,
      kolam_id: jadwalDipilih.value.kolam_id,
      ...form.value
    })
  })
  showForm.value = false
  await muat()
}

function bukaTambahJadwal() {
  formJadwalBaru.value = { kolam_id: '', tanggal_jadwal: new Date().toISOString().slice(0, 10) }
  showTambahJadwal.value = true
}

async function simpanJadwalBaru() {
  const kolamDipilih = daftarKolamAktif.value.find(k => k.id === Number(formJadwalBaru.value.kolam_id))
  if (!kolamDipilih) return

  await fetch('/api/jadwal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tebar_id: kolamDipilih.tebar_id,
      kolam_id: kolamDipilih.id,
      jenis: 'ganti_air',
      tanggal_jadwal: formJadwalBaru.value.tanggal_jadwal
    })
  })
  showTambahJadwal.value = false
  await muat()
}

function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

onMounted(() => {
  muat()
  muatKolamAktif()
})
</script>

<template>
  <div class="flex justify-end mb-4">
    <button
      type="button"
      class="px-4 py-2 rounded-lg bg-brand-500 text-white text-[13px] font-semibold hover:bg-brand-600"
      @click="bukaTambahJadwal"
    >
      + Tambah Jadwal Ganti Air
    </button>
  </div>

  <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tgl Jadwal</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Status</th>
          <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="j in daftar" :key="j.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
          <td class="px-4 py-3 font-semibold">{{ j.nama_kolam }}</td>
          <td class="px-4 py-3">{{ j.nama_ikan }}</td>
          <td class="px-4 py-3">{{ j.jumlah_saat_ini }}</td>
          <td class="px-4 py-3">{{ tanggal(j.tanggal_jadwal) }}</td>
          <td class="px-4 py-3">
            <span
              class="px-2 py-1 rounded-full text-[11.5px] font-semibold"
              :class="j.status === 'selesai'
                ? 'bg-ok-100 text-ok-600 dark:bg-ok-600/25 dark:text-ok-500'
                : 'bg-warn-100 text-warn-600 dark:bg-warn-600/25 dark:text-warn-500'"
            >
              {{ j.status === 'selesai' ? 'Selesai' : 'Belum' }}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button v-if="j.status !== 'selesai'" type="button" class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600" @click="bukaForm(j)">
              Catat Ganti Air
            </button>
          </td>
        </tr>
        <tr v-if="daftar.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada jadwal ganti air.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal: Catat Ganti Air -->
  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-4">Catat Ganti Air — {{ jadwalDipilih?.nama_kolam }}</h2>
      <form class="space-y-3" @submit.prevent="simpan">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
          <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Persentase Air Diganti (%)</label>
          <input v-model="form.persentase_air" type="number" min="0" max="100" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Catatan (opsional)</label>
          <textarea v-model="form.catatan" class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"></textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: Tambah Jadwal Ganti Air -->
  <div v-if="showTambahJadwal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showTambahJadwal = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Jadwal Ganti Air</h2>
      <form class="space-y-3" @submit.prevent="simpanJadwalBaru">
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam</label>
          <select v-model="formJadwalBaru.kolam_id" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]">
            <option value="" disabled>Pilih kolam</option>
            <option v-for="k in daftarKolamAktif" :key="k.id" :value="k.id">
              {{ k.nama_kolam }} — {{ k.nama_ikan }} ({{ k.jumlah_saat_ini }} ekor)
            </option>
          </select>
          <p v-if="daftarKolamAktif.length === 0" class="text-[12px] text-ink-500 dark:text-ink-300 mt-1">
            Tidak ada kolam dengan tebar aktif saat ini.
          </p>
        </div>
        <div>
          <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal Jadwal</label>
          <input v-model="formJadwalBaru.tanggal_jadwal" type="date" required class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showTambahJadwal = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>
</template>
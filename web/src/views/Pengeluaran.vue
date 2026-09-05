<script setup>
import { ref, onMounted } from 'vue'

const tab = ref('pengeluaran') // pengeluaran | pakan
const daftarPengeluaran = ref([])
const daftarPakan = ref([])
const daftarKolam = ref([])
const showForm = ref(false)

const formPengeluaran = ref({
  kategori: 'lainnya',
  jumlah: '',
  deskripsi: '',
  tanggal: new Date().toISOString().slice(0, 10)
})

const formPakan = ref({
  kolam_id: '',
  jumlah_kg: '',
  biaya: '',
  catatan: '',
  tanggal: new Date().toISOString().slice(0, 10)
})

async function muat() {
  const [pe, pa, km] = await Promise.all([
    fetch('/api/pengeluaran').then(r => r.json()),
    fetch('/api/pakan').then(r => r.json()),
    fetch('/api/kolam').then(r => r.json())
  ])
  daftarPengeluaran.value = pe.data
  daftarPakan.value = pa.data
  daftarKolam.value = km.data
}

async function simpanPengeluaran() {
  const res = await fetch('/api/pengeluaran', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formPengeluaran.value)
  })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan pengeluaran')
    return
  }
  showForm.value = false
  formPengeluaran.value = {
    kategori: 'lainnya',
    jumlah: '',
    deskripsi: '',
    tanggal: new Date().toISOString().slice(0, 10)
  }
  await muat()
}

async function simpanPakan() {
  const res = await fetch('/api/pakan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formPakan.value)
  })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menyimpan pakan')
    return
  }
  showForm.value = false
  formPakan.value = {
    kolam_id: '',
    jumlah_kg: '',
    biaya: '',
    catatan: '',
    tanggal: new Date().toISOString().slice(0, 10)
  }
  await muat()
}

async function hapusPengeluaran(id) {
  if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return

  const res = await fetch(`/api/pengeluaran/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menghapus')
    return
  }
  await muat()
}

async function hapusPakan(id) {
  if (!confirm('Yakin ingin menghapus data pakan ini?')) return

  const res = await fetch(`/api/pakan/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    alert(err.message || 'Gagal menghapus')
    return
  }
  await muat()
}

function rupiah(n) {
  return 'Rp' + Number(n).toLocaleString('id-ID')
}

function tanggal(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(muat)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-[13.5px] font-semibold"
          :class="tab === 'pengeluaran' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 dark:text-ink-300'"
          @click="tab = 'pengeluaran'"
        >
          Pengeluaran Lain
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-[13.5px] font-semibold"
          :class="tab === 'pakan' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-ink-700 border border-ink-100 dark:border-ink-500 dark:text-ink-300'"
          @click="tab = 'pakan'"
        >
          Pakan Harian
        </button>
      </div>
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="showForm = true"
      >
        + Tambah
      </button>
    </div>

    <!-- Tabel Pengeluaran Lain -->
    <div
      v-if="tab === 'pengeluaran'"
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kategori</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Deskripsi</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Total</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in daftarPengeluaran"
            :key="p.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3 capitalize">{{ p.kategori }}</td>
            <td class="px-4 py-3">{{ p.deskripsi || '-' }}</td>
            <td class="px-4 py-3 font-semibold">{{ rupiah(p.jumlah) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12.5px] font-semibold hover:bg-red-600"
                @click="hapusPengeluaran(p.id)"
              >
                Hapus
              </button>
            </td>
          </tr>
          <tr v-if="!daftarPengeluaran.length">
            <td colspan="5" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              Belum ada pengeluaran lain.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tabel Pakan -->
    <div
      v-else
      class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden"
    >
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Tanggal</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah (kg)</th>
            <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Biaya</th>
            <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in daftarPakan"
            :key="p.id"
            class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100"
          >
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3">{{ p.nama_kolam }}</td>
            <td class="px-4 py-3">{{ p.jumlah_kg }}</td>
            <td class="px-4 py-3 font-semibold">{{ rupiah(p.biaya) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[12.5px] font-semibold hover:bg-red-600"
                @click="hapusPakan(p.id)"
              >
                Hapus
              </button>
            </td>
          </tr>
          <tr v-if="!daftarPakan.length">
            <td colspan="5" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
              Belum ada catatan pakan.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <!-- Form Pengeluaran -->
        <template v-if="tab === 'pengeluaran'">
          <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Pengeluaran</h2>
          <form class="space-y-3" @submit.prevent="simpanPengeluaran">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kategori</label>
              <select
                v-model="formPengeluaran.kategori"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
              >
                <option value="obat">Obat</option>
                <option value="listrik">Listrik</option>
                <option value="gaji">Gaji</option>
                <option value="perlengkapan">Perlengkapan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Total</label>
              <input
                v-model="formPengeluaran.jumlah"
                type="number"
                min="0"
                required
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Deskripsi</label>
              <input
                v-model="formPengeluaran.deskripsi"
                type="text"
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
              />
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
              <input
                v-model="formPengeluaran.tanggal"
                type="date"
                required
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
        </template>

        <!-- Form Pakan -->
        <template v-else>
          <h2 class="text-[16px] font-semibold dark:text-white mb-4">Tambah Pakan Harian</h2>
          <form class="space-y-3" @submit.prevent="simpanPakan">
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Kolam</label>
              <select
                v-model="formPakan.kolam_id"
                required
                class="w-full rounded-lg border border-ink-100 dark:border-ink-500 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900 dark:text-white"
              >
                <option value="" disabled>Pilih kolam</option>
                <option v-for="k in daftarKolam" :key="k.id" :value="k.id">
                  {{ k.nama_kolam }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Jumlah (kg)</label>
                <input
                  v-model="formPakan.jumlah_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
                />
              </div>
              <div>
                <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Biaya</label>
                <input
                  v-model="formPakan.biaya"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-ink-100 dark:border-ink-500 dark:bg-ink-900 dark:text-white px-3 py-2.5 text-[13.5px]"
                />
              </div>
            </div>
            <div>
              <label class="block text-[13px] font-medium dark:text-ink-300 mb-1">Tanggal</label>
              <input
                v-model="formPakan.tanggal"
                type="date"
                required
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
        </template>
      </div>
    </div>
  </div>
</template>
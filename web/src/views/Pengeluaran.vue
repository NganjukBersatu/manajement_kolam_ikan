<script setup>
import { ref, onMounted } from 'vue'

const daftarPengeluaran = ref([])
const showForm = ref(false)

const formPengeluaran = ref({
  kategori: 'lainnya',
  jumlah: '',
  deskripsi: '',
  tanggal: new Date().toISOString().slice(0, 10)
})

async function muat() {
  const res = await fetch('/api/pengeluaran')
  const json = await res.json()
  daftarPengeluaran.value = json.data
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
      <h1 class="text-[18px] font-semibold dark:text-white">Pengeluaran</h1>
      <button
        type="button"
        class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600"
        @click="showForm = true"
      >
        + Tambah
      </button>
    </div>

    <!-- Tabel Pengeluaran -->
    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
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
              Belum ada pengeluaran.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah Pengeluaran -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
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
      </div>
    </div>
  </div>
</template>
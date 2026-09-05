<script setup>
import { ref, onMounted } from 'vue'

const daftar = ref([])
const daftarJenisIkan = ref([])
const daftarKolam = ref([])
const showForm = ref(false)
const form = ref({ tanggal: new Date().toISOString().slice(0, 10), jenis_ikan_id: '', kolam_id: '', jumlah_kg: '', harga_per_kg: '', catatan: '' })

async function muat() {
  const [pj, ji, km] = await Promise.all([
    fetch('/api/penjualan').then(r => r.json()),
    fetch('/api/jenis-ikan').then(r => r.json()),
    fetch('/api/kolam').then(r => r.json())
  ])
  daftar.value = pj.data
  daftarJenisIkan.value = ji.data
  daftarKolam.value = km.data
}

async function simpan() {
  await fetch('/api/penjualan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value)
  })
  showForm.value = false
  form.value = { tanggal: new Date().toISOString().slice(0, 10), jenis_ikan_id: '', kolam_id: '', jumlah_kg: '', harga_per_kg: '', catatan: '' }
  await muat()
}

async function hapus(id) {
  if (!confirm('Hapus transaksi ini?')) return
  await fetch(`/api/penjualan/${id}`, { method: 'DELETE' })
  await muat()
}

function rupiah(n) { return 'Rp' + Number(n).toLocaleString('id-ID') }
function tanggal(d) { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }

onMounted(muat)
</script>

<template>
  <div>
    <div class="flex justify-end mb-4">
      <button type="button" class="px-4 py-2.5 rounded-lg bg-brand-500 text-white text-[13.5px] font-semibold hover:bg-brand-600" @click="showForm = true">
        + Tambah Penjualan
      </button>
    </div>

    <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
      <table class="w-full text-left text-[13.5px]">
        <thead>
          <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
            <th class="px-4 py-3">Tanggal</th>
            <th class="px-4 py-3">Jenis Ikan</th>
            <th class="px-4 py-3">Kolam</th>
            <th class="px-4 py-3">Jumlah (kg)</th>
            <th class="px-4 py-3">Harga/kg</th>
            <th class="px-4 py-3">Total</th>
            <th class="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in daftar" :key="p.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0">
            <td class="px-4 py-3">{{ tanggal(p.tanggal) }}</td>
            <td class="px-4 py-3">{{ p.nama_ikan }}</td>
            <td class="px-4 py-3">{{ p.nama_kolam || '-' }}</td>
            <td class="px-4 py-3">{{ p.jumlah_kg }}</td>
            <td class="px-4 py-3">{{ rupiah(p.harga_per_kg) }}</td>
            <td class="px-4 py-3 font-semibold">{{ rupiah(p.total) }}</td>
            <td class="px-4 py-3 text-right">
              <button type="button" class="text-danger-600 text-[12.5px] font-semibold" @click="hapus(p.id)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
      <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
        <h2 class="text-[16px] font-semibold mb-4">Tambah Penjualan</h2>
        <form class="space-y-3" @submit.prevent="simpan">
          <div>
            <label class="block text-[13px] font-medium mb-1">Tanggal</label>
            <input v-model="form.tanggal" type="date" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
          </div>
          <div>
            <label class="block text-[13px] font-medium mb-1">Jenis Ikan</label>
            <select v-model="form.jenis_ikan_id" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900">
              <option value="" disabled>Pilih jenis ikan</option>
              <option v-for="ji in daftarJenisIkan" :key="ji.id" :value="ji.id">{{ ji.nama }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[13px] font-medium mb-1">Kolam (opsional)</label>
            <select v-model="form.kolam_id" class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px] bg-white dark:bg-ink-900">
              <option value="">Tidak diketahui</option>
              <option v-for="k in daftarKolam" :key="k.id" :value="k.id">{{ k.nama_kolam }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium mb-1">Jumlah (kg)</label>
              <input v-model="form.jumlah_kg" type="number" step="0.1" min="0" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
            </div>
            <div>
              <label class="block text-[13px] font-medium mb-1">Harga/kg</label>
              <input v-model="form.harga_per_kg" type="number" min="0" required class="w-full rounded-lg border border-ink-100 px-3 py-2.5 text-[13.5px]" />
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 rounded-lg border border-ink-100 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
            <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
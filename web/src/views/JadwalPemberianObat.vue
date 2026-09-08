<script setup>
import { ref, onMounted, computed } from 'vue'

const daftarKolam = ref([])
const riwayatObat = ref([])

const showForm = ref(false)
const kolamDipilih = ref(null)
const form = ref({ tanggal: new Date().toISOString().slice(0, 10), nama_obat: '', dosis: '', biaya: '', catatan: '' })

const showRiwayat = ref(false)
const riwayatKolamDipilih = ref(null)

// Hanya tampilkan kolam yang sedang aktif (ada ikannya)
const kolamAktif = computed(() => daftarKolam.value.filter(k => k.status === 'aktif'))

// Gabungkan setiap kolam dengan catatan pemberian obat TERAKHIR miliknya.
// Obat tidak diberikan rutin per hari, jadi tidak ada status "Sudah/Belum" —
// cukup tampilkan tanggal & jenis obat terakhir sebagai referensi.
const daftarGabungan = computed(() => {
  return kolamAktif.value.map(k => {
    const riwayatKolam = riwayatObat.value
      .filter(r => r.kolam_id === k.id)
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))

    const terakhir = riwayatKolam[0] || null

    return {
      ...k,
      tanggal_terakhir: terakhir?.tanggal || null,
      obat_terakhir: terakhir?.nama_obat || null,
      riwayat: riwayatKolam
    }
  })
})

async function muatKolam() {
  const res = await fetch('/api/kolam')
  const json = await res.json()
  daftarKolam.value = json.data
}

async function muatRiwayat() {
  const res = await fetch('/api/obat')
  const json = await res.json()
  riwayatObat.value = json.data
}

function bukaForm(k) {
  kolamDipilih.value = k
  form.value = { tanggal: new Date().toISOString().slice(0, 10), nama_obat: '', dosis: '', biaya: '', catatan: '' }
  showForm.value = true
}

async function simpan() {
  const res = await fetch('/api/obat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kolam_id: kolamDipilih.value.id,
      tanggal: form.value.tanggal,
      nama_obat: form.value.nama_obat,
      dosis: form.value.dosis,
      biaya: form.value.biaya || 0,
      catatan: form.value.catatan
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    alert(err.message || 'Gagal menyimpan pemberian obat')
    return
  }

  showForm.value = false
  await Promise.all([muatKolam(), muatRiwayat()])
}

function bukaRiwayat(k) {
  riwayatKolamDipilih.value = k
  showRiwayat.value = true
}

function rupiah(n) {
  return n ? Number(n).toLocaleString('id-ID') : '-'
}

function tanggal(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => {
  muatKolam()
  muatRiwayat()
})
</script>

<template>
  <div class="bg-white dark:bg-ink-700 rounded-card border border-ink-100 dark:border-ink-500 shadow-card overflow-hidden">
    <table class="w-full text-left text-[13.5px]">
      <thead>
        <tr class="border-b border-ink-100 dark:border-ink-500 bg-ink-50/50 dark:bg-ink-900/40">
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Kolam</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jenis Ikan</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Jumlah Saat Ini</th>
          <th class="px-4 py-3 text-ink-500 dark:text-ink-300 font-semibold">Terakhir Diberi Obat</th>
          <th class="px-4 py-3 text-right text-ink-500 dark:text-ink-300 font-semibold">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="k in daftarGabungan" :key="k.id" class="border-b border-ink-100 dark:border-ink-500 last:border-0 dark:text-ink-100">
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
          <td class="px-4 py-3 text-right space-x-2 whitespace-nowrap">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 text-[12.5px] font-semibold"
              @click="bukaRiwayat(k)"
            >
              Lihat riwayat
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[12.5px] font-semibold hover:bg-brand-600"
              @click="bukaForm(k)"
            >
              Catat Pemberian Obat
            </button>
          </td>
        </tr>
        <tr v-if="daftarGabungan.length === 0">
          <td colspan="5" class="px-4 py-6 text-center text-[13px] text-ink-500 dark:text-ink-300">
            Belum ada kolam aktif untuk diberi obat.
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Modal: catat pemberian obat -->
  <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40" @click="showForm = false" />
    <div class="relative bg-white dark:bg-ink-700 rounded-card shadow-card w-full max-w-md p-5">
      <h2 class="text-[16px] font-semibold dark:text-white mb-4">Catat Pemberian Obat — {{ kolamDipilih?.nama_kolam }}</h2>
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
        <div class="flex gap-3 pt-2">
          <button type="button" class="flex-1 rounded-lg border border-ink-100 dark:border-ink-500 dark:text-ink-300 py-2.5 text-[13.5px] font-semibold" @click="showForm = false">Batal</button>
          <button type="submit" class="flex-1 rounded-lg bg-brand-500 text-white py-2.5 text-[13.5px] font-semibold hover:bg-brand-600">Simpan</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal: riwayat pemberian obat per kolam -->
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
</template>
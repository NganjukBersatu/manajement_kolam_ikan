import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

const LABEL_KATEGORI = {
  pakan: 'Pakan',
  obat: 'Obat & vitamin',
  listrik: 'Listrik',
  gaji: 'Gaji',
  perlengkapan: 'Perlengkapan',
  lainnya: 'Lainnya'
}

router.get('/', async (req, res) => {
  try {
    const kolamResult = await pool.query('SELECT status FROM kolam')
    const totalKolam = kolamResult.rows.length
    const kolamAktif = kolamResult.rows.filter(k => k.status === 'aktif').length
    const kolamKosong = kolamResult.rows.filter(k => k.status === 'kosong').length

    const ikanResult = await pool.query(
      `SELECT COALESCE(SUM(jumlah_saat_ini), 0) AS total FROM tebar WHERE status = 'aktif'`
    )

    const jadwalResult = await pool.query(`
      SELECT j.id, j.jenis, j.tanggal_jadwal, k.nama_kolam, ji.nama AS nama_ikan
      FROM jadwal j
      JOIN kolam k ON k.id = j.kolam_id
      JOIN tebar t ON t.id = j.tebar_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      WHERE j.status = 'belum'
      ORDER BY j.tanggal_jadwal ASC
      LIMIT 5
    `)

    const penjualanResult = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total FROM penjualan
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
    `)

    const penjualanBulanLaluResult = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total FROM penjualan
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE - interval '1 month')
    `)

    // Total pengeluaran bulan ini = pengeluaran manual (selain kategori 'obat', yang tidak
    // dipakai) + biaya pakan + biaya obat. Kategori 'obat' di tabel pengeluaran sengaja
    // dikecualikan supaya tidak dobel hitung dengan tabel obat.
    const pengeluaranResult = await pool.query(`
      SELECT
        COALESCE((SELECT SUM(jumlah) FROM pengeluaran WHERE kategori != 'obat' AND date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)), 0)
        + COALESCE((SELECT SUM(biaya) FROM pakan WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)), 0)
        + COALESCE((SELECT SUM(biaya) FROM obat WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)), 0)
        AS total
    `)

    const pengeluaranBulanLaluResult = await pool.query(`
      SELECT
        COALESCE((SELECT SUM(jumlah) FROM pengeluaran WHERE kategori != 'obat' AND date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
        + COALESCE((SELECT SUM(biaya) FROM pakan WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
        + COALESCE((SELECT SUM(biaya) FROM obat WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
        AS total
    `)

    // Rekonstruksi ikan hidup di awal bulan ini, tanpa perlu tabel snapshot:
    // sekarang + kematian bulan ini (sortir) + panen bulan ini - tebar baru bulan ini
    const rekonKematianResult = await pool.query(`
      SELECT COALESCE(SUM(jumlah_mati), 0) AS total FROM sortir
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
    `)
    const rekonPanenResult = await pool.query(`
      SELECT COALESCE(SUM(jumlah_ekor), 0) AS total FROM panen
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
    `)
    const rekonTebarBaruResult = await pool.query(`
      SELECT COALESCE(SUM(jumlah_bibit), 0) AS total FROM tebar
      WHERE date_trunc('month', tanggal_tebar) = date_trunc('month', CURRENT_DATE)
    `)

    // Rincian pengeluaran per kategori (untuk breakdown di dashboard)
    const breakdownResult = await pool.query(`
      SELECT kategori, SUM(jumlah) AS total
      FROM pengeluaran
      WHERE kategori != 'obat' AND date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)
      GROUP BY kategori

      UNION ALL

      SELECT 'pakan' AS kategori, COALESCE(SUM(biaya), 0) AS total
      FROM pakan
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)

      UNION ALL

      SELECT 'obat' AS kategori, COALESCE(SUM(biaya), 0) AS total
      FROM obat
      WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)

      ORDER BY total DESC
    `)

    const totalPenjualan = Number(penjualanResult.rows[0].total)
    const totalPengeluaran = Number(pengeluaranResult.rows[0].total)
    const penjualanBulanLalu = Number(penjualanBulanLaluResult.rows[0].total)
    const pengeluaranBulanLalu = Number(pengeluaranBulanLaluResult.rows[0].total)
    const keuntunganBulanLalu = penjualanBulanLalu - pengeluaranBulanLalu

    // Breakdown ikan hidup per kolam (bibit awal vs sekarang + survival rate)
    const ikanPerKolamResult = await pool.query(`
      SELECT k.id AS kolam_id, k.nama_kolam, ji.nama AS nama_ikan,
             t.jumlah_bibit, t.jumlah_saat_ini, t.tanggal_tebar
      FROM tebar t
      JOIN kolam k ON k.id = t.kolam_id
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      WHERE t.status = 'aktif'
      ORDER BY k.nama_kolam
    `)

    const ikanPerKolam = ikanPerKolamResult.rows.map(r => {
      const bibit = Number(r.jumlah_bibit)
      const sekarang = Number(r.jumlah_saat_ini)
      return {
        kolamId: r.kolam_id,
        namaKolam: r.nama_kolam,
        namaIkan: r.nama_ikan,
        jumlahBibit: bibit,
        jumlahSaatIni: sekarang,
        tanggalTebar: r.tanggal_tebar,
        survivalRate: bibit > 0 ? Math.round((sekarang / bibit) * 100) : 0
      }
    })

    const pengeluaranBreakdown = breakdownResult.rows
      .map(r => ({
        kategori: r.kategori,
        label: LABEL_KATEGORI[r.kategori] || r.kategori,
        total: Number(r.total)
      }))
      .filter(r => r.total > 0)

    const totalIkanSekarang = Number(ikanResult.rows[0].total)
    const ikanAwalBulan =
      totalIkanSekarang +
      Number(rekonKematianResult.rows[0].total) +
      Number(rekonPanenResult.rows[0].total) -
      Number(rekonTebarBaruResult.rows[0].total)
    const keuntunganBulanIni = totalPenjualan - totalPengeluaran

    // Persentase perubahan dibanding periode sebelumnya. null kalau pembandingnya 0
    // (supaya frontend tidak menampilkan "naik tak terhingga %").
    function persenPerubahan(sekarang, sebelumnya) {
      if (!sebelumnya || sebelumnya === 0) return null
      return Math.round(((sekarang - sebelumnya) / sebelumnya) * 100)
    }

    const perbandingan = {
      ikanHidup: {
        bulanLalu: ikanAwalBulan,
        persen: persenPerubahan(totalIkanSekarang, ikanAwalBulan)
      },
      penjualan: {
        bulanLalu: penjualanBulanLalu,
        persen: persenPerubahan(totalPenjualan, penjualanBulanLalu)
      },
      keuntungan: {
        bulanLalu: keuntunganBulanLalu,
        persen: persenPerubahan(keuntunganBulanIni, keuntunganBulanLalu)
      }
    }

    res.json({
      statistik: {
        totalKolam,
        kolamAktif,
        kolamKosong,
        totalIkanHidup: totalIkanSekarang,
        penjualanBulanIni: totalPenjualan,
        pengeluaranBulanIni: totalPengeluaran,
        keuntunganBulanIni
      },
      perbandingan,
      pengeluaranBreakdown,
      ikanPerKolam,
      jadwalMendatang: jadwalResult.rows
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil data dashboard', error: err.message })
  }
})

export default router
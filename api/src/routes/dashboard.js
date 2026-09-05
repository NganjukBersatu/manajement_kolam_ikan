import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

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

    const pengeluaranResult = await pool.query(`
      SELECT
        COALESCE((SELECT SUM(jumlah) FROM pengeluaran WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)), 0)
        + COALESCE((SELECT SUM(biaya) FROM pakan WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE)), 0)
        AS total
    `)

    const totalPenjualan = Number(penjualanResult.rows[0].total)
    const totalPengeluaran = Number(pengeluaranResult.rows[0].total)

    res.json({
      statistik: {
        totalKolam,
        kolamAktif,
        kolamKosong,
        totalIkanHidup: Number(ikanResult.rows[0].total),
        penjualanBulanIni: totalPenjualan,
        pengeluaranBulanIni: totalPengeluaran,
        keuntunganBulanIni: totalPenjualan - totalPengeluaran
      },
      jadwalMendatang: jadwalResult.rows
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil data dashboard', error: err.message })
  }
})

export default router
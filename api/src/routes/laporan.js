import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

// GET /api/laporan?bulan=9&tahun=2026
router.get('/', async (req, res) => {
  try {
    const now = new Date()
    const bulan = parseInt(req.query.bulan) || (now.getMonth() + 1)
    const tahun = parseInt(req.query.tahun) || now.getFullYear()

    const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`

    // Hitung bulan sebelumnya
    let prevBulan = bulan - 1
    let prevTahun = tahun
    if (prevBulan === 0) {
      prevBulan = 12
      prevTahun = tahun - 1
    }
    const prevStartDate = `${prevTahun}-${String(prevBulan).padStart(2, '0')}-01`

    // ========== DATA BULAN YANG DIPILIH ==========
    const penjualanResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_penjualan, 
        COALESCE(SUM(jumlah_kg), 0) AS total_kg
      FROM penjualan
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [startDate])

    const pengeluaranResult = await pool.query(`
      SELECT COALESCE(SUM(jumlah), 0) AS total
      FROM pengeluaran
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [startDate])

    const pakanResult = await pool.query(`
      SELECT 
        COALESCE(SUM(biaya), 0) AS total, 
        COALESCE(SUM(jumlah_kg), 0) AS total_kg
      FROM pakan
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [startDate])

    const panenResult = await pool.query(`
      SELECT 
        COALESCE(SUM(jumlah_ekor), 0) AS total_ekor, 
        COALESCE(SUM(berat_kg), 0) AS total_kg
      FROM panen
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [startDate])

    // ========== DATA BULAN SEBELUMNYA ==========
    const prevPenjualan = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total_penjualan
      FROM penjualan
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [prevStartDate])

    const prevPengeluaran = await pool.query(`
      SELECT COALESCE(SUM(jumlah), 0) AS total
      FROM pengeluaran
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [prevStartDate])

    const prevPakan = await pool.query(`
      SELECT COALESCE(SUM(biaya), 0) AS total
      FROM pakan
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [prevStartDate])

    const prevPanen = await pool.query(`
      SELECT 
        COALESCE(SUM(jumlah_ekor), 0) AS total_ekor, 
        COALESCE(SUM(berat_kg), 0) AS total_kg
      FROM panen
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
    `, [prevStartDate])

    // ========== DETAIL PENGELUARAN ==========
    const detailPengeluaranIni = await pool.query(`
      SELECT id, kategori, jumlah, deskripsi, tanggal
      FROM pengeluaran
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
      ORDER BY tanggal DESC
    `, [startDate])

    const detailPengeluaranLalu = await pool.query(`
      SELECT id, kategori, jumlah, deskripsi, tanggal
      FROM pengeluaran
      WHERE date_trunc('month', tanggal) = date_trunc('month', $1::date)
      ORDER BY tanggal DESC
    `, [prevStartDate])

    // ========== STOK PER KOLAM (selalu data terkini) ==========
    const perKolamResult = await pool.query(`
      SELECT 
        k.nama_kolam, 
        ji.nama AS jenis_ikan, 
        t.jumlah_bibit, 
        t.jumlah_saat_ini, 
        t.tanggal_tebar
      FROM kolam k
      JOIN tebar t ON t.kolam_id = k.id AND t.status = 'aktif'
      JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
      ORDER BY k.nama_kolam ASC
    `)

    // Hitung total
    const totalPenjualan = Number(penjualanResult.rows[0].total_penjualan)
    const totalPengeluaranLain = Number(pengeluaranResult.rows[0].total)
    const totalBiayaPakan = Number(pakanResult.rows[0].total)
    const totalPengeluaran = totalPengeluaranLain + totalBiayaPakan

    const prevTotalPenjualan = Number(prevPenjualan.rows[0].total_penjualan)
    const prevTotalPengeluaran = Number(prevPengeluaran.rows[0].total) + Number(prevPakan.rows[0].total)

    res.json({
      data: {
        // Bulan yang dipilih
        total_penjualan: totalPenjualan,
        total_kg_terjual: Number(penjualanResult.rows[0].total_kg),
        total_pengeluaran: totalPengeluaran,
        total_biaya_pakan: totalBiayaPakan,
        total_kg_pakan: Number(pakanResult.rows[0].total_kg),
        total_panen_ekor: Number(panenResult.rows[0].total_ekor),
        total_panen_kg: Number(panenResult.rows[0].total_kg),
        keuntungan: totalPenjualan - totalPengeluaran,

        // Bulan sebelumnya
        bulan_lalu: {
          panen_ekor: Number(prevPanen.rows[0].total_ekor),
          panen_kg: Number(prevPanen.rows[0].total_kg),
          penjualan: prevTotalPenjualan,
          pengeluaran: prevTotalPengeluaran,
          keuntungan: prevTotalPenjualan - prevTotalPengeluaran
        },

        // Detail pengeluaran
        pengeluaran_bulan_ini: detailPengeluaranIni.rows,
        pengeluaran_bulan_lalu: detailPengeluaranLalu.rows,

        // Stok terkini
        per_kolam: perKolamResult.rows
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Gagal mengambil laporan', error: err.message })
  }
})

export default router
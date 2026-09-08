import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

const SESI_VALID = ['pagi', 'siang', 'sore']

// GET /api/pakan
// Support: ?tanggal=2026-09-08  atau  ?bulan=9&tahun=2026
router.get('/', async (req, res) => {
  const { tanggal, bulan, tahun } = req.query

  try {
    const params = []
    let where = ''
    let idx = 1

    if (tanggal) {
      params.push(tanggal)
      where = `WHERE p.tanggal = $${idx++}`
    } else if (bulan && tahun) {
      params.push(Number(bulan), Number(tahun))
      where = `WHERE EXTRACT(MONTH FROM p.tanggal) = $${idx++} AND EXTRACT(YEAR FROM p.tanggal) = $${idx++}`
    }

    const result = await pool.query(
      `SELECT 
         p.id, 
         p.kolam_id, 
         p.sesi, 
         p.tanggal::text AS tanggal,
         p.jumlah_kg, 
         p.biaya, 
         p.catatan, 
         p.stok_pakan_id,
         k.nama_kolam, 
         sp.nama AS nama_pakan
       FROM pakan p
       LEFT JOIN kolam k ON k.id = p.kolam_id
       LEFT JOIN stok_pakan sp ON sp.id = p.stok_pakan_id
       ${where}
       ORDER BY p.tanggal DESC, p.sesi`,
      params
    )

    res.json({ data: result.rows })
  } catch (err) {
    console.error('Error GET /api/pakan:', err.message)
    res.status(500).json({ 
      message: 'Gagal mengambil data pakan', 
      error: err.message 
    })
  }
})

// GET /api/pakan/kolam/:kolam_id
router.get('/kolam/:kolam_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         p.id, p.kolam_id, p.sesi, p.tanggal::text AS tanggal,
         p.jumlah_kg, p.biaya, p.catatan, p.stok_pakan_id,
         k.nama_kolam, sp.nama AS nama_pakan
       FROM pakan p
       LEFT JOIN kolam k ON k.id = p.kolam_id
       LEFT JOIN stok_pakan sp ON sp.id = p.stok_pakan_id
       WHERE p.kolam_id = $1
       ORDER BY p.tanggal DESC, p.sesi
       LIMIT 100`,
      [req.params.kolam_id]
    )
    res.json({ data: result.rows })
  } catch (err) {
    console.error('Error GET /api/pakan/kolam:', err.message)
    res.status(500).json({ message: 'Gagal mengambil riwayat pakan', error: err.message })
  }
})

// POST /api/pakan → catat pakan + kurangi stok
router.post('/', async (req, res) => {
  const { kolam_id, tanggal, sesi, jumlah_kg, biaya, catatan, stok_pakan_id } = req.body

  if (!kolam_id || !tanggal || !jumlah_kg) {
    return res.status(400).json({ message: 'kolam_id, tanggal, jumlah_kg wajib diisi' })
  }
  if (!sesi || !SESI_VALID.includes(sesi)) {
    return res.status(400).json({ message: `sesi wajib diisi salah satu dari: ${SESI_VALID.join(', ')}` })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Validasi & kurangi stok jika stok_pakan_id dikirim
    if (stok_pakan_id) {
      const stokRes = await client.query(
        'SELECT id, nama, stok FROM stok_pakan WHERE id = $1 FOR UPDATE',
        [stok_pakan_id]
      )

      if (stokRes.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({ message: 'Jenis pakan tidak ditemukan di stok' })
      }

      const sisa = Number(stokRes.rows[0].stok)
      const dipakai = Number(jumlah_kg)

      if (dipakai > sisa) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          message: `Stok tidak cukup. Sisa ${stokRes.rows[0].nama}: ${sisa} kg`
        })
      }

      await client.query(
        'UPDATE stok_pakan SET stok = stok - $1 WHERE id = $2',
        [dipakai, stok_pakan_id]
      )
    }

    // Insert catatan pakan
    const result = await client.query(
      `INSERT INTO pakan (kolam_id, tanggal, sesi, jumlah_kg, biaya, catatan, stok_pakan_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, kolam_id, sesi, tanggal::text AS tanggal, jumlah_kg, biaya, catatan, stok_pakan_id`,
      [
        kolam_id,
        tanggal,
        sesi,
        jumlah_kg,
        biaya || 0,
        catatan || null,
        stok_pakan_id || null
      ]
    )

    await client.query('COMMIT')
    res.status(201).json({ data: result.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error POST /api/pakan:', err.message)

    if (err.code === '23505') {
      return res.status(409).json({ message: 'Sesi ini sudah dicatat untuk kolam dan tanggal tersebut' })
    }
    res.status(500).json({ message: 'Gagal mencatat pakan', error: err.message })
  } finally {
    client.release()
  }
})

// DELETE /api/pakan/:id → hapus + kembalikan stok
router.delete('/:id', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query(
      'SELECT id, jumlah_kg, stok_pakan_id FROM pakan WHERE id = $1 FOR UPDATE',
      [req.params.id]
    )

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Data pakan tidak ditemukan' })
    }

    const row = existing.rows[0]

    // Kembalikan stok
    if (row.stok_pakan_id) {
      await client.query(
        'UPDATE stok_pakan SET stok = stok + $1 WHERE id = $2',
        [row.jumlah_kg, row.stok_pakan_id]
      )
    }

    await client.query('DELETE FROM pakan WHERE id = $1', [req.params.id])
    await client.query('COMMIT')

    res.json({ message: 'Data pakan dihapus' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error DELETE /api/pakan:', err.message)
    res.status(500).json({ message: 'Gagal menghapus data pakan', error: err.message })
  } finally {
    client.release()
  }
})

export default router
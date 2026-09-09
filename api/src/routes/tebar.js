import { Router } from 'express'
import { pool } from '../config/db.js'

const router = Router()

router.post('/', async (req, res) => {
  const { kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit } = req.body
  if (!kolam_id || !jenis_ikan_id || !tanggal_tebar || !jumlah_bibit) {
    return res.status(400).json({ message: 'kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit wajib diisi' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const kolamCek = await client.query(`SELECT status FROM kolam WHERE id = $1`, [kolam_id])
    if (kolamCek.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Kolam tidak ditemukan' })
    }
    if (kolamCek.rows[0].status === 'aktif') {
      await client.query('ROLLBACK')
      return res.status(409).json({ message: 'Kolam ini masih ada tebar aktif' })
    }

    const jenisResult = await client.query(
      'SELECT hari_sortir, hari_panen, hari_obat_pertama, interval_obat_hari FROM jenis_ikan WHERE id = $1',
      [jenis_ikan_id]
    )
    if (jenisResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Jenis ikan tidak ditemukan' })
    }
    const { hari_sortir, hari_panen, hari_obat_pertama, interval_obat_hari } = jenisResult.rows[0]

    const tebarResult = await client.query(
      `INSERT INTO tebar (kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit, jumlah_saat_ini)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [kolam_id, jenis_ikan_id, tanggal_tebar, jumlah_bibit]
    )
    const tebarBaru = tebarResult.rows[0]

    await client.query(`UPDATE kolam SET status = 'aktif', updated_at = NOW() WHERE id = $1`, [kolam_id])

    // Jadwal sortir & panen otomatis dari tanggal_tebar + hari yang ditentukan jenis ikan
    await client.query(
      `INSERT INTO jadwal (tebar_id, kolam_id, jenis, tanggal_jadwal)
       VALUES
        ($1, $2, 'sortir', ($3::date + ($4 || ' days')::interval)::date),
        ($1, $2, 'panen',  ($3::date + ($5 || ' days')::interval)::date)`,
      [tebarBaru.id, kolam_id, tanggal_tebar, hari_sortir, hari_panen]
    )

    // Jadwal obat: mulai dari hari_obat_pertama, berulang tiap interval_obat_hari, sampai maksimal hari_panen.
    // Kalau interval_obat_hari kosong (NULL), obat cuma dijadwalkan sekali.
    const hariObatPertamaNum = Number(hari_obat_pertama)
    const hariPanenNum = Number(hari_panen)
    const intervalObatNum = interval_obat_hari != null ? Number(interval_obat_hari) : null

    const hariObatList = []
    if (hariObatPertamaNum <= hariPanenNum) {
      if (intervalObatNum && intervalObatNum > 0) {
        for (let h = hariObatPertamaNum; h <= hariPanenNum; h += intervalObatNum) {
          hariObatList.push(h)
        }
      } else {
        hariObatList.push(hariObatPertamaNum)
      }
    }

    for (const hari of hariObatList) {
      await client.query(
        `INSERT INTO jadwal (tebar_id, kolam_id, jenis, tanggal_jadwal)
         VALUES ($1, $2, 'obat', ($3::date + ($4 || ' days')::interval)::date)`,
        [tebarBaru.id, kolam_id, tanggal_tebar, hari]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ data: tebarBaru })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Gagal mencatat tebar', error: err.message })
  } finally {
    client.release()
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, k.nama_kolam, ji.nama AS nama_ikan
       FROM tebar t
       JOIN kolam k ON k.id = t.kolam_id
       JOIN jenis_ikan ji ON ji.id = t.jenis_ikan_id
       WHERE t.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tebar tidak ditemukan' })
    res.json({ data: result.rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data tebar', error: err.message })
  }
})

export default router
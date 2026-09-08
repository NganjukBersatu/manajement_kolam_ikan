import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'kolam_ikan2',
  user: 'postgres',
  password: 'magang123',   // ← langsung ditulis
});

// Test koneksi PostgreSQL
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL berhasil terhubung');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL gagal terhubung:', error.message);
    return false;
  }
};

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});
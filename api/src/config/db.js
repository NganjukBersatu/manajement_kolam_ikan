import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

// Menangani error dari PostgreSQL
pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});
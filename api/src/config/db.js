import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // load file .env

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kolam',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,   // ← diambil dari .env
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
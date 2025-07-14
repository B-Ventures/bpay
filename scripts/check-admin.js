// Script to check if admin user exists in database
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function checkAdminUser() {
  try {
    // Check if admin user exists
    const { rows } = await pool.query('SELECT * FROM users WHERE "isAdmin" = true');
    console.log('Admin users found:', rows.length);
    
    if (rows.length > 0) {
      console.log('Admin user details:');
      console.log('ID:', rows[0].id);
      console.log('Username:', rows[0].username);
      console.log('Is Admin:', rows[0].isAdmin);
      
      return rows[0];
    } else {
      console.log('No admin user found. Creating one...');
      
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      const result = await pool.query(
        'INSERT INTO users (username, password, email, "fullName", "isAdmin") VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['admin', hashedPassword, 'admin@getbpay.com', 'System Administrator', true]
      );
      
      console.log('Admin user created:');
      console.log('ID:', result.rows[0].id);
      console.log('Username:', result.rows[0].username);
      console.log('Is Admin:', result.rows[0].isAdmin);
      
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error checking/creating admin user:', error);
  } finally {
    pool.end();
  }
}

// Run the check
checkAdminUser();
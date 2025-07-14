/**
 * This script checks if an admin user exists in the database,
 * and creates one if it doesn't.
 */
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/auth';

async function createAdminUser() {
  try {
    console.log('Checking for admin user...');
    
    // Check if admin user exists
    const existingAdmins = await db.select().from(users).where(eq(users.isAdmin, true));
    
    if (existingAdmins.length > 0) {
      console.log('Admin user already exists:');
      console.log('ID:', existingAdmins[0].id);
      console.log('Username:', existingAdmins[0].username);
      console.log('Email:', existingAdmins[0].email);
      return;
    }
    
    // Create admin user
    console.log('No admin user found. Creating one...');
    const hashedPassword = await hashPassword('admin123');
    
    const newAdmin = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@getbpay.com',
      fullName: 'System Administrator',
      isAdmin: true,
    }).returning();
    
    console.log('Admin user created with ID:', newAdmin[0].id);
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

// Run the function
createAdminUser();
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    const { createUser } = await import('./lib/userService');
    const user = await createUser({
      username: 'AT2205',
      email: 'superuser@example.com',
      fullName: 'Super Admin',
      role: 'Administrator',
      password: 'Ajju@2205'
    });
    if (user) {
      console.log('Admin user seeded successfully:', user);
    } else {
      console.log('Failed to seed admin user');
    }
  } catch (error) {
    console.error('Error seeding user:', error);
  }
}

seed();
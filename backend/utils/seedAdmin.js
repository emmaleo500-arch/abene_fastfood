/**
 * Seeds the first admin user from .env variables.
 * Called once on server startup — skipped if admin already exists.
 */
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: 'admin' });
    if (exists) return;

    await User.create({
      name:     'Admin',
      email:    process.env.ADMIN_EMAIL    || 'admin@sarvoraa.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role:     'admin',
    });

    console.log('🌱  Default admin created:', process.env.ADMIN_EMAIL);
    console.log('    ⚠️  Change the password after first login!');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = seedAdmin;

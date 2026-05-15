const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('./server/data/manhole.db');

const user = db.prepare('SELECT username, password FROM users WHERE username = ?').get('admin');
if (user) {
  console.log('Password length:', user.password.length);
  console.log('Starts with $2a:', user.password.startsWith('$2a'));
  console.log('First 10 chars:', user.password.substring(0, 10));
  
  // Test bcrypt comparison
  const testPassword = 'admin123';
  const isValid = bcrypt.compareSync(testPassword, user.password);
  console.log('bcrypt.compareSync("admin123", stored):', isValid);
  
  // Generate a new hash and test
  const newHash = bcrypt.hashSync('admin123', 10);
  console.log('New hash length:', newHash.length);
  console.log('New hash:', newHash);
  const isValidNew = bcrypt.compareSync('admin123', newHash);
  console.log('bcrypt.compareSync with new hash:', isValidNew);
} else {
  console.log('No admin user found');
}

db.close();

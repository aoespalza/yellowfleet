const bcrypt = require('bcryptjs');

// Hash from DB
const storedHash = '$2a$10$gAwBOLAu6CR/v4LWIaq6mO3.toTLtN8FF5RCTS1Dg40JPeYssxGGW';
const password = 'admin123';

const result = bcrypt.compareSync(password, storedHash);
console.log('Password match:', result);

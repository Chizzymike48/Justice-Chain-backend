require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB connection...');
console.log('URI (first 50 chars):', uri.substring(0, 50) + '...');

mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log('Connection Status:', mongoose.connection.readyState);
  console.log('DB Name:', mongoose.connection.name);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB Connection Failed:', err.message);
  process.exit(1);
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('❌ Connection timeout (15s)');
  process.exit(1);
}, 15000);

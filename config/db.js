// ================================================
//  Database Configuration — MongoDB Atlas Connection
// ================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<db_username>') || uri.includes('<password>')) {
    console.warn('\n⚠️  [MongoDB Warning] MONGODB_URI still contains placeholders (<username>, <db_username>, or <password>).');
    console.warn('   Please replace <db_username> with your actual database user name created in MongoDB Atlas:');
    console.warn('   MONGODB_URI=mongodb+srv://YOUR_DB_USER:YOUR_PASSWORD@cluster0.jlwbfvb.mongodb.net/royalstitch?retryWrites=true&w=majority\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`\n🌿 MongoDB Atlas Connected successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('\n❌ MongoDB Atlas Connection Error:', error.message);
    console.error('   Verify your IP access list in MongoDB Atlas Network Access and credentials in .env.\n');
    return false;
  }
};

module.exports = connectDB;


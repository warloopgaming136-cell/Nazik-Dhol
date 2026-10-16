const mongoose = require('mongoose');

// Establishes connection to MongoDB using the URI defined in .env
const connectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;

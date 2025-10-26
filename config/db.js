const mongoose = require('mongoose');
require('dotenv').config();

/**
 * MongoDB connection configuration
 * Uses environment variables for secure connection
 */
const connectDB = async () => {
  try {
    // Construct MongoDB URI with password from environment
    const password = process.env.DB_PASSWORD;
    if (!password) {
      throw new Error('DB_PASSWORD environment variable is required');
    }

    const mongoURI = `mongodb+srv://collegek450_db_user:${password}@dataprivacyvault.tsgey4d.mongodb.net/?appName=DataPrivacyVault`;

    // Connection options for MongoDB Atlas
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

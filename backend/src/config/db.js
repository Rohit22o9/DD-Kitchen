const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../backend/.env') });
require('dotenv').config();
const mongoose = require('mongoose');

let isMemoryServer = false;
let memoryServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dailydrop_kitchen';
  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net');

  try {
    // 1. Try connecting to configured MongoDB (Atlas or Local service)
    const options = {
      serverSelectionTimeoutMS: isAtlas ? 15000 : 3000,
    };

    if (isAtlas) {
      console.log('[Database] Connecting to MongoDB Atlas Cloud Cluster...');
    }

    await mongoose.connect(uri, options);
    console.log(`[Database] MongoDB Connected successfully: ${mongoose.connection.host}/${mongoose.connection.name}`);
    if (isAtlas) {
      console.log('[Database] Connected to remote MongoDB Atlas cluster.');
    }
    return;
  } catch (err) {
    if (isAtlas) {
      console.error(`\n[Database] ❌ MongoDB Atlas Connection Failed: ${err.message}`);
      console.error('[Database] Common Atlas fixes:');
      console.error('  1. In MongoDB Atlas -> Network Access: Add IP Address -> "Allow Access from Anywhere" (0.0.0.0/0).');
      console.error('  2. In MongoDB Atlas -> Database Access: Check that your database username and password are correct.');
      console.error('  3. Ensure special characters in your password are URL encoded (e.g. @ -> %40).\n');
      throw err;
    }

    console.warn(`[Database] Standard local MongoDB connection to ${uri} failed: ${err.message}`);
    console.log('[Database] Initiating in-memory MongoDB environment for seamless local development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();
      
      await mongoose.connect(memoryUri);
      isMemoryServer = true;
      console.log(`[Database] In-Memory MongoDB running at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};

module.exports = { connectDB, closeDB };

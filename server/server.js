require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { createAuth } = require('./auth');
const { connectDatabase } = require('./config/database');
const corsMiddleware = require('./middleware/cors');
const setupRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

let auth;

// Initialize database and auth
const initializeApp = async () => {
  try {
    await connectDatabase();
    auth = await createAuth();
    console.log('✅ Better Auth initialized');
    
    // Setup routes after auth is initialized
    setupRoutes(app, auth);
  } catch (err) {
    console.error('Initialization error:', err);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeApp();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

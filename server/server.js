require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { toNodeHandler } = require('better-auth/node');
const { createAuth } = require('./auth');
const Item = require('./models/Item');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Middleware - CORS configuration for Better Auth
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:19006', 
    'http://localhost:19000',
    'https://freelance2-cxyi.onrender.com',
    process.env.BETTER_AUTH_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

let auth;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize Better Auth after MongoDB connection
    auth = await createAuth();
    console.log('✅ Better Auth initialized');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Better Auth Routes - must come before other routes
app.use('/api/auth', async (req, res, next) => {
  if (!auth) {
    return res.status(503).json({ message: 'Auth service not ready' });
  }
  
  console.log(`📍 Better Auth request: ${req.method} ${req.path}`);
  console.log(`📍 Query params:`, req.query);
  
  // Handle Google OAuth manually - MUST be before Better Auth handler
  if (req.path === '/sign-in/google' || req.path === '/signin/google') {
    const currentURL = req.query.currentURL || process.env.BETTER_AUTH_URL || 'https://freelance2-cxyi.onrender.com';
    const redirectURI = `${process.env.BETTER_AUTH_URL || 'https://freelance2-cxyi.onrender.com'}/api/auth/callback/google`;
    
    console.log('🔍 Sign-in initiated - currentURL:', currentURL);
    console.log('🔍 redirectURI:', redirectURI);
    
    // Redirect to Google OAuth
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectURI,
        response_type: 'code',
        scope: 'openid email profile',
        state: currentURL, // Store the return URL
      }).toString();
    
    console.log('🔀 Redirecting to Google:', googleAuthUrl);
    return res.redirect(googleAuthUrl);
  }
  
  // Handle Google OAuth callback - intercept BEFORE Better Auth
  if (req.path === '/callback/google') {
    console.log('🔙 Callback path matched!');
    console.log('🔙 Has code?', !!req.query.code);
    console.log('🔙 State:', req.query.state);
    
    if (req.query.code) {
      try {
        const code = req.query.code;
        const returnURL = req.query.state || process.env.BETTER_AUTH_URL || 'https://freelance2-cxyi.onrender.com';
      
      console.log('🔙 Google callback received, exchanging code for tokens...');
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${process.env.BETTER_AUTH_URL || 'https://freelance2-cxyi.onrender.com'}/api/auth/callback/google`,
          grant_type: 'authorization_code',
        }).toString(),
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        console.error('❌ Failed to get access token:', tokens);
        return res.redirect(`${returnURL}?error=auth_failed`);
      }
      
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      
      const googleUser = await userInfoResponse.json();
      console.log('✅ Google user info received:', googleUser.email);
      
      // Create or update user in database
      const db = mongoose.connection.db;
      const usersCollection = db.collection('user');
      const sessionsCollection = db.collection('session');
      const accountsCollection = db.collection('account');
      
      let user = await usersCollection.findOne({ email: googleUser.email });
      
      if (!user) {
        console.log('Creating new user for Google:', googleUser.email);
        const userId = new mongoose.Types.ObjectId();
        const newUser = {
          _id: userId,
          id: userId.toString(),
          email: googleUser.email,
          emailVerified: googleUser.verified_email || true,
          name: googleUser.name,
          image: googleUser.picture,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await usersCollection.insertOne(newUser);
        user = newUser;
        
        // Store Google account link
        await accountsCollection.insertOne({
          _id: new mongoose.Types.ObjectId(),
          userId: user._id,
          provider: 'google',
          providerAccountId: googleUser.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        user.id = user._id.toString();
        // Update existing user
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { updatedAt: new Date(), image: googleUser.picture } }
        );
      }
      
      // Create session
      const sessionToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      await sessionsCollection.insertOne({
        _id: new mongoose.Types.ObjectId(),
        userId: user._id,
        token: sessionToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Google OAuth session created');
      
      // Set cookie
      res.cookie('better-auth.session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      // Redirect back to the app with session info in URL
      const redirectUrl = `${returnURL}?session_token=${sessionToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }))}`;
      
      return res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      const fallbackURL = req.query.state || process.env.BETTER_AUTH_URL || 'https://freelance2-cxyi.onrender.com';
      return res.redirect(`${fallbackURL}?error=auth_failed`);
    }
    } else {
      console.log('❌ No code in callback, passing to Better Auth');
    }
  }
  
  // Intercept phone verification to use Twilio
  if (req.path === '/phone-number/verify' && req.method === 'POST') {
    try {
      const { phoneNumber, code } = req.body;
      console.log('🔍 Custom verify endpoint called for:', phoneNumber, 'Code:', code);
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ 
          error: { code: 'INVALID_REQUEST', message: 'Phone number and code required' }
        });
      }
      
      // Verify with Twilio
      if (twilioClient && process.env.TWILIO_SERVICE_ID) {
        try {
          const verificationCheck = await twilioClient.verify.v2
            .services(process.env.TWILIO_SERVICE_ID)
            .verificationChecks.create({
              to: phoneNumber,
              code: code
            });
          
          console.log('🔍 Twilio verification status:', verificationCheck.status);
          
          if (verificationCheck.status !== 'approved') {
            return res.status(400).json({ 
              error: { code: 'INVALID_OTP', message: 'Invalid OTP', status: 400 }
            });
          }
          
          console.log('✅ OTP verified successfully, creating/logging in user');
          
          // Manually handle user creation/login since Twilio verified
          const db = mongoose.connection.db;
          const usersCollection = db.collection('user');
          const sessionsCollection = db.collection('session');
          
          // Find or create user
          let user = await usersCollection.findOne({ phoneNumber });
          
          if (!user) {
            console.log('Creating new user for:', phoneNumber);
            const userId = new mongoose.Types.ObjectId();
            const newUser = {
              _id: userId,
              id: userId.toString(),
              phoneNumber,
              phoneNumberVerified: true,
              email: `${phoneNumber.replace('+', '')}@phone.user`,
              emailVerified: false,
              name: phoneNumber,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await usersCollection.insertOne(newUser);
            user = newUser;
          } else {
            // Update verification status
            await usersCollection.updateOne(
              { phoneNumber },
              { 
                $set: { 
                  phoneNumberVerified: true,
                  updatedAt: new Date()
                }
              }
            );
            user.id = user._id.toString();
          }
          
          // Create session manually
          const sessionToken = require('crypto').randomBytes(32).toString('hex');
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          
          const session = {
            _id: new mongoose.Types.ObjectId(),
            userId: user._id,
            token: sessionToken,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await sessionsCollection.insertOne(session);
          
          console.log('✅ Session created successfully');
          
          // Set cookie for Better Auth client
          res.cookie('better-auth.session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
          });
          
          // Return response in Better Auth format
          return res.json({
            user: {
              id: user.id,
              phoneNumber: user.phoneNumber,
              phoneNumberVerified: user.phoneNumberVerified,
              email: user.email,
              emailVerified: user.emailVerified,
              name: user.name,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            },
            session: {
              token: sessionToken,
              expiresAt: expiresAt.toISOString(),
              userId: user.id
            }
          });
          
        } catch (twilioError) {
          console.error('❌ Twilio verification error:', twilioError.message);
          return res.status(400).json({ 
            error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP', status: 400 }
          });
        }
      }
    } catch (error) {
      console.error('Error in custom verify:', error);
      return res.status(500).json({
        error: { code: 'SERVER_ERROR', message: 'Internal server error' }
      });
    }
  }
  
  return toNodeHandler(auth)(req, res);
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create item
app.post('/api/items', async (req, res) => {
  try {
    const item = new Item({
      name: req.body.name,
      description: req.body.description
    });
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (req.body.name) item.name = req.body.name;
    if (req.body.description) item.description = req.body.description;
    
    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

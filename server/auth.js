require('dotenv').config();
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');
const { phoneNumber } = require('better-auth/plugins');
const mongoose = require('mongoose');
const twilio = require('twilio');

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Store Twilio verifications to map Better Auth codes
const verificationMap = new Map();

async function createAuth() {
  // Get MongoDB connection from mongoose
  const db = mongoose.connection.db;

  console.log('🔧 Configuring Better Auth...');
  console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('Base URL:', process.env.BETTER_AUTH_URL);
  
  const redirectURI = `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`;
  console.log('Google Redirect URI:', redirectURI);

  const authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    
    trustedOrigins: [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:19000',
      'https://freelance2-cxyi.onrender.com',
      process.env.BETTER_AUTH_URL,
    ],
    
    database: mongodbAdapter(db),

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectURI: redirectURI,
      },
    },

    plugins: [
      phoneNumber({
        otpLength: 6,
        requireVerification: true,
        sendOTP: async ({ phoneNumber, code }) => {
          console.log('📱 OTP will be sent to', phoneNumber);
          
          // Send SMS via Twilio Verify Service
          if (twilioClient && process.env.TWILIO_SERVICE_ID) {
            try {
              const verification = await twilioClient.verify.v2
                .services(process.env.TWILIO_SERVICE_ID)
                .verifications.create({
                  to: phoneNumber,
                  channel: 'sms'
                });
              
              if (verification && ['pending', 'approved'].includes(verification.status)) {
                console.log('✅ OTP sent successfully via SMS. Status:', verification.status);
                verificationMap.set(phoneNumber, verification.sid);
                return true;
              } else {
                console.log('❌ OTP send failed. Status:', verification.status);
                return false;
              }
            } catch (error) {
              console.error('❌ Twilio SMS failed:', error.message);
              console.log('💡 Console fallback: OTP:', code);
              return true;
            }
          } else {
            console.log('⚠️ Twilio not configured. Console OTP:', code);
            return true;
          }
        },
        // Store a dummy code in Better Auth DB so it doesn't fail
        // Actual verification happens in server.js middleware
        signUpOnVerification: {
          getTempEmail: (phone) => `${phone}@tempuser.com`,
          getTempName: (phone) => phone,
        },
      }),
    ],
  });
  
  console.log('✅ Better Auth instance created');
  return authInstance;
}

module.exports = { createAuth };

// API Configuration
// For testing on web/emulator: use localhost
// For testing on physical device: use your computer's IP address (e.g., '192.168.1.100')

// Uncomment the appropriate line based on your testing environment:
// export const API_BASE_URL = 'http://localhost:5000';  // For web/emulator
export const API_BASE_URL = 'http://10.116.202.178:5000';  // For physical device

// Note: Phone OTP (Twilio) works with IP address
// Google OAuth requires additional setup for mobile (see below)

export default {
  API_BASE_URL,
};

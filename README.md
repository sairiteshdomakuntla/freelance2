# Freelance2 Full Stack App

## Features
- 🔐 Better Auth authentication with phone OTP
- 🔑 Google OAuth login support
- 📱 React Native Expo frontend
- 🚀 Express.js + MongoDB backend
- ✅ Full CRUD operations

## Backend Setup (Express + MongoDB + Better Auth)

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### Environment Variables
Update `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/freelance2
BETTER_AUTH_SECRET=supersecretlongrandomstringchangethisinproduction
BETTER_AUTH_URL=https://freelance2-cxyi.onrender.com
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Starting the Backend
```bash
cd server
npm start
```

The backend runs on `https://freelance2-cxyi.onrender.com`

### Backend Features
- Better Auth with MongoDB adapter
- Phone number OTP authentication (console logging for development)
- Google OAuth provider (optional - configure in .env)
- REST API for items CRUD
- Session management

### API Endpoints

**Auth Endpoints** (handled by Better Auth):
- `POST /api/auth/phone-number/send-otp` - Send OTP to phone
- `POST /api/auth/phone-number/verify-otp` - Verify OTP
- `POST /api/auth/sign-in/social` - Google OAuth
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

**Items Endpoints**:
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

## Frontend Setup (Expo React Native)

### Starting the Frontend
```bash
cd client
npm start
```

### Configuration
Update API URL in `client/lib/authClient.ts` for physical device testing:
```typescript
const API_URL = 'http://YOUR_COMPUTER_IP:5000';
```

### Frontend Features
- Better Auth React client
- Phone OTP login flow
- Google OAuth login (with expo-auth-session)
- Protected routes with session checking
- Items management UI
- Logout functionality

### Screens
- `/` - Initial route (checks auth and redirects)
- `/login` - Phone number and Google login
- `/verify-otp` - OTP verification screen
- `/home` - Main app with items CRUD

## Getting Started

1. **Start MongoDB**:
```bash
mongod
```

2. **Start Backend**:
```bash
cd server
npm start
```

3. **Start Frontend**:
```bash
cd client
npm start
```

4. **Test the App**:
   - Press 'w' for web or scan QR with Expo Go
   - Login with phone number (OTP appears in backend console)
   - Or use Google login (requires Google OAuth setup)

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://freelance2-cxyi.onrender.com/api/auth/callback/google`
5. Update `.env` with your client ID and secret
6. Update `client/lib/googleLogin.ts` with your client ID

## Project Structure
```
├── server/
│   ├── models/
│   │   └── Item.js
│   ├── auth.js           # Better Auth config
│   ├── server.js         # Express server
│   ├── .env
│   └── package.json
├── client/
│   ├── app/
│   │   ├── index.tsx     # Auth check & redirect
│   │   ├── login.tsx     # Login screen
│   │   ├── verify-otp.tsx # OTP verification
│   │   ├── home.tsx      # Main app
│   │   └── _layout.tsx   # Navigation setup
│   ├── lib/
│   │   ├── authClient.ts # Better Auth client
│   │   └── googleLogin.ts # Google OAuth helper
│   ├── services/
│   │   └── api.ts        # API service
│   ├── types/
│   │   └── item.ts
│   └── package.json
```

## Development Notes

- OTP codes are printed in the backend console for development
- Replace the `sendOTP` function in `server/auth.js` with a real SMS provider (Fast2SMS, MSG91, Twilio) for production
- Google login requires proper OAuth credentials
- Session is managed by Better Auth and stored in MongoDB


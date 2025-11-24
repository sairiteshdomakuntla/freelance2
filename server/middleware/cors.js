const cors = require('cors');

const corsOptions = {
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
};

module.exports = cors(corsOptions);

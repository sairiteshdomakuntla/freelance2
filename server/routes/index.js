const setupAuthRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');

const setupRoutes = (app, auth) => {
  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Event Management API' });
  });

  // Auth routes
  setupAuthRoutes(app, auth);
  
  // User routes
  app.use('/api/users', userRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);
};

module.exports = setupRoutes;

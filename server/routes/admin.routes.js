const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyAuth, requireAdmin } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (with pagination and filters)
 * @access  Admin only
 */
router.get('/users', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive,
      search 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await usersCollection.countDocuments(query);
    
    res.json({
      users: users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive !== false,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @access  Admin only
 */
router.get('/users/:id', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(req.params.id) 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { _id, ...userWithoutId } = user;
    
    res.json({
      id: _id.toString(),
      ...userWithoutId
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Enable or disable user account
 * @access  Admin only
 */
router.patch('/users/:id/status', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive must be a boolean value' 
      });
    }
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    // Prevent admin from disabling their own account
    if (req.params.id === req.user.id) {
      return res.status(400).json({ 
        message: 'Cannot disable your own account' 
      });
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { 
        $set: { 
          isActive,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { _id, ...userWithoutId } = result;
    
    res.json({
      id: _id.toString(),
      ...userWithoutId,
      message: `User account ${isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get('/stats', verifyAuth, requireAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    const totalUsers = await usersCollection.countDocuments();
    const activeUsers = await usersCollection.countDocuments({ isActive: true });
    const inactiveUsers = await usersCollection.countDocuments({ isActive: false });
    
    const customerCount = await usersCollection.countDocuments({ role: 'Customer' });
    const vendorCount = await usersCollection.countDocuments({ role: 'Vendor' });
    const adminCount = await usersCollection.countDocuments({ role: 'Admin' });
    
    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: {
        customers: customerCount,
        vendors: vendorCount,
        admins: adminCount
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;

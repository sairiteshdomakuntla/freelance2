const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyAuth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(req.user.id) 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive fields
    const { _id, ...userWithoutId } = user;
    
    res.json({
      id: _id.toString(),
      ...userWithoutId
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', verifyAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    const { 
      name, 
      bio, 
      address,
      businessName,
      businessDescription,
      serviceCategory,
      image 
    } = req.body;
    
    // Build update object
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (address) updateData.address = address;
    if (image !== undefined) updateData.image = image;
    
    // Vendor-specific fields (only if user is vendor)
    if (req.user.role === 'Vendor') {
      if (businessName !== undefined) updateData.businessName = businessName;
      if (businessDescription !== undefined) updateData.businessDescription = businessDescription;
      if (serviceCategory) updateData.serviceCategory = serviceCategory;
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.user.id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { _id, ...userWithoutId } = result;
    
    res.json({
      id: _id.toString(),
      ...userWithoutId
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

/**
 * @route   PUT /api/users/me/role
 * @desc    Update user role during registration (one-time only)
 * @access  Private
 */
router.put('/me/role', verifyAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['Customer', 'Vendor'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be Customer or Vendor' 
      });
    }
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('user');
    
    // Check if user already has a role set
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(req.user.id) 
    });
    
    // If role is already set, don't allow changing it
    if (user.role) {
      return res.status(400).json({ 
        message: 'Role has already been set and cannot be changed' 
      });
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.user.id) },
      { 
        $set: { 
          role,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    const { _id, ...userWithoutId } = result;
    
    res.json({
      id: _id.toString(),
      ...userWithoutId
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Better Auth fields
  email: {
    type: String,
    required: true,
    lowercase: true,
    sparse: true, // Allow multiple null/undefined values but unique non-null values
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneNumber: {
    type: String,
    sparse: true,
    unique: true,
  },
  phoneNumberVerified: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  
  // Event Management specific fields
  role: {
    type: String,
    enum: ['Customer', 'Vendor', 'Admin'],
    default: 'Customer',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  
  // Vendor specific fields
  businessName: {
    type: String,
  },
  businessDescription: {
    type: String,
  },
  serviceCategory: {
    type: String,
    enum: ['Catering', 'Photography', 'Venue', 'Decoration', 'Entertainment', 'Other'],
  },
  
}, {
  timestamps: true,
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);

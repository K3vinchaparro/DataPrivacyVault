const mongoose = require('mongoose');

/**
 * Mapping Schema
 * Stores the relationship between tokens and their original PII values
 */
const mappingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['NAME', 'EMAIL', 'PHONE'],
    index: true
  },
  originalValue: {
    type: String,
    required: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'mappings'
});

// Compound index for efficient queries
mappingSchema.index({ type: 1, token: 1 });
mappingSchema.index({ token: 1, type: 1 });

// Static method to find mapping by token
mappingSchema.statics.findByToken = function(token) {
  return this.findOne({ token });
};

// Static method to find mappings by type
mappingSchema.statics.findByType = function(type) {
  return this.find({ type });
};

// Static method to create a new mapping
mappingSchema.statics.createMapping = function(type, originalValue, token) {
  return this.create({
    type,
    originalValue,
    token
  });
};

// Instance method to check if mapping is expired
mappingSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Pre-save middleware to validate data
mappingSchema.pre('save', function(next) {
  // Ensure token format is correct
  if (!this.token.match(/^(NAME|EMAIL|PHONE)_[a-z0-9]{8}$/)) {
    return next(new Error('Invalid token format'));
  }
  
  // Ensure type matches token prefix
  const tokenPrefix = this.token.split('_')[0];
  if (tokenPrefix !== this.type) {
    return next(new Error('Token type does not match mapping type'));
  }
  
  next();
});

// Virtual for formatted display
mappingSchema.virtual('displayName').get(function() {
  return `${this.type}: ${this.originalValue} -> ${this.token}`;
});

// Ensure virtual fields are serialized
mappingSchema.set('toJSON', { virtuals: true });
mappingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mapping', mappingSchema);

const crypto = require('crypto');
const Mapping = require('../../models/Mapping');

/**
 * PII Detection Patterns
 * These regex patterns are used to identify different types of PII in text
 */
const PII_PATTERNS = {
  // Email pattern - matches standard email formats
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone number patterns - supports various international formats
  PHONE: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})|(?:\+?[1-9]\d{1,14})/g,
  
  // Name patterns - detects capitalized words that could be names
  // This is a basic pattern and may need refinement based on specific requirements
  NAME: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
};

/**
 * MongoDB-based storage for token mappings
 * Replaces in-memory storage with persistent database storage
 */

/**
 * Generates a secure alphanumeric token with prefix and stores the mapping in MongoDB
 * @param {string} originalValue - The original PII value
 * @param {string} type - The type of PII (NAME, EMAIL, PHONE)
 * @param {number} length - Length of the token part (default: 8)
 * @returns {Promise<string>} Prefixed token (e.g., NAME_e1be92e2b3a5)
 */
const generateToken = async (originalValue, type, length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let tokenPart = '';
  
  // Use crypto.randomBytes for cryptographically secure randomness
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    tokenPart += chars[randomBytes[i] % chars.length];
  }
  
  const fullToken = `${type}_${tokenPart}`;
  
  try {
    // Store the mapping in MongoDB
    await Mapping.createMapping(type, originalValue, fullToken);
    console.log(`✅ Stored mapping: ${type} -> ${fullToken}`);
  } catch (error) {
    console.error('Error storing mapping in MongoDB:', error);
    // If there's a duplicate token, generate a new one
    if (error.code === 11000) { // Duplicate key error
      return await generateToken(originalValue, type, length);
    }
    throw error;
  }
  
  return fullToken;
};

/**
 * Detects PII in a given text message
 * @param {string} message - The text message to analyze
 * @returns {Object} Object containing detected PII with their positions
 */
const detectPII = (message) => {
  const detectedPII = {
    emails: [],
    phones: [],
    names: []
  };

  // Detect emails
  let emailMatch;
  while ((emailMatch = PII_PATTERNS.EMAIL.exec(message)) !== null) {
    detectedPII.emails.push({
      value: emailMatch[0],
      start: emailMatch.index,
      end: emailMatch.index + emailMatch[0].length,
      type: 'email'
    });
  }

  // Detect phone numbers
  let phoneMatch;
  while ((phoneMatch = PII_PATTERNS.PHONE.exec(message)) !== null) {
    detectedPII.phones.push({
      value: phoneMatch[0],
      start: phoneMatch.index,
      end: phoneMatch.index + phoneMatch[0].length,
      type: 'phone'
    });
  }

  // Detect names (this is a simplified approach)
  let nameMatch;
  while ((nameMatch = PII_PATTERNS.NAME.exec(message)) !== null) {
    // Filter out common words that might be capitalized but aren't names
    const commonWords = ['THE', 'AND', 'OR', 'BUT', 'IN', 'ON', 'AT', 'TO', 'FOR', 'OF', 'WITH', 'BY'];
    const nameValue = nameMatch[0].toUpperCase();
    
    if (!commonWords.includes(nameValue) && nameMatch[0].length > 2) {
      detectedPII.names.push({
        value: nameMatch[0],
        start: nameMatch.index,
        end: nameMatch.index + nameMatch[0].length,
        type: 'name'
      });
    }
  }

  return detectedPII;
};

/**
 * Anonymizes PII in a text message by replacing it with alphanumeric tokens
 * @param {string} message - The original message containing PII
 * @returns {string} The anonymized message with PII replaced by tokens
 */
const anonymizeMessage = async (message) => {
  try {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message: must be a non-empty string');
    }

    // Detect all PII in the message
    const detectedPII = detectPII(message);
    
    // Combine all detected PII and sort by position (descending) to replace from end to start
    const allPII = [
      ...detectedPII.emails,
      ...detectedPII.phones,
      ...detectedPII.names
    ].sort((a, b) => b.start - a.start);

    let anonymizedMessage = message;

    // Replace each PII with a token (working backwards to maintain correct positions)
    for (const pii of allPII) {
      const token = await generateToken(pii.value, pii.type.toUpperCase(), 8);
      anonymizedMessage = anonymizedMessage.substring(0, pii.start) + 
                         token + 
                         anonymizedMessage.substring(pii.end);
    }

    return anonymizedMessage;
  } catch (error) {
    console.error('Error in anonymizeMessage:', error);
    throw new Error(`Failed to anonymize message: ${error.message}`);
  }
};

/**
 * Deanonymizes a message by replacing tokens with their original values from MongoDB
 * @param {string} anonymizedMessage - The message containing tokens
 * @returns {Promise<string>} The original message with PII restored
 */
const deanonymizeMessage = async (anonymizedMessage) => {
  try {
    if (!anonymizedMessage || typeof anonymizedMessage !== 'string') {
      throw new Error('Invalid anonymized message: must be a non-empty string');
    }

    let originalMessage = anonymizedMessage;

    // Find all tokens in the message (format: TYPE_token)
    const tokenPattern = /\b(NAME|EMAIL|PHONE)_[a-z0-9]{8}\b/g;
    const tokens = anonymizedMessage.match(tokenPattern) || [];

    // Replace each token with its original value from MongoDB
    for (const token of tokens) {
      try {
        const mapping = await Mapping.findByToken(token);
        if (mapping) {
          originalMessage = originalMessage.replace(token, mapping.originalValue);
          console.log(`✅ Restored mapping: ${token} -> ${mapping.originalValue}`);
        } else {
          console.warn(`Token not found in MongoDB: ${token}`);
          // Keep the token if no mapping is found
        }
      } catch (dbError) {
        console.error(`Error looking up token ${token}:`, dbError);
        // Keep the token if there's a database error
      }
    }

    return originalMessage;
  } catch (error) {
    console.error('Error in deanonymizeMessage:', error);
    throw new Error(`Failed to deanonymize message: ${error.message}`);
  }
};

/**
 * Gets the current token mappings from MongoDB (for debugging purposes)
 * @returns {Promise<Array>} Array of mapping documents
 */
const getTokenMappings = async () => {
  try {
    return await Mapping.find({}).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching token mappings:', error);
    return [];
  }
};

/**
 * Clears all token mappings from MongoDB (for testing purposes)
 * @returns {Promise<Object>} Deletion result
 */
const clearTokenMappings = async () => {
  try {
    const result = await Mapping.deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} token mappings from MongoDB`);
    return result;
  } catch (error) {
    console.error('Error clearing token mappings:', error);
    throw error;
  }
};

/**
 * Gets mapping statistics from MongoDB
 * @returns {Promise<Object>} Statistics about stored mappings
 */
const getMappingStats = async () => {
  try {
    const stats = await Mapping.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          latest: { $max: '$createdAt' }
        }
      }
    ]);
    
    const total = await Mapping.countDocuments();
    
    return {
      total,
      byType: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting mapping stats:', error);
    return { total: 0, byType: [], timestamp: new Date().toISOString() };
  }
};

module.exports = {
  anonymizeMessage,
  deanonymizeMessage,
  detectPII,
  generateToken,
  getTokenMappings,
  clearTokenMappings,
  getMappingStats,
  PII_PATTERNS
};

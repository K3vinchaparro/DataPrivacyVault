const Joi = require('joi');

/**
 * Validation schema for the deanonymize request
 * Ensures the anonymizedMessage field is present and contains valid tokens
 */
const deanonymizeRequestSchema = Joi.object({
  anonymizedMessage: Joi.string()
    .min(1)
    .max(10000)
    .pattern(/\b(NAME|EMAIL|PHONE)_[a-z0-9]{8}\b/) // Must contain at least one valid token
    .required()
    .messages({
      'string.empty': 'Anonymized message cannot be empty',
      'string.min': 'Anonymized message must contain at least 1 character',
      'string.max': 'Anonymized message cannot exceed 10,000 characters',
      'string.pattern.base': 'Anonymized message must contain valid tokens (NAME_, EMAIL_, or PHONE_ followed by 8 alphanumeric characters)',
      'any.required': 'Anonymized message field is required'
    })
});

/**
 * Validation schema for the secureChatGPT request
 * Ensures the prompt field is present and contains valid content
 */
const secureChatGPTRequestSchema = Joi.object({
  prompt: Joi.string()
    .min(1)
    .max(5000) // Reasonable limit for prompts
    .required()
    .messages({
      'string.empty': 'Prompt cannot be empty',
      'string.min': 'Prompt must contain at least 1 character',
      'string.max': 'Prompt cannot exceed 5,000 characters',
      'any.required': 'Prompt field is required'
    })
});

/**
 * Validation schema for the anonymize request
 * Ensures the message field is present and is a non-empty string
 */
const anonymizeRequestSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(10000) // Reasonable limit to prevent abuse
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must contain at least 1 character',
      'string.max': 'Message cannot exceed 10,000 characters',
      'any.required': 'Message field is required'
    })
});

/**
 * Middleware to validate the anonymize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateAnonymizeRequest = (req, res, next) => {
  try {
    // Validate the request body against the schema
    const { error, value } = anonymizeRequestSchema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Format validation errors for better user experience
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    }

    // Replace req.body with the validated and sanitized data
    req.body = value;
    next();
  } catch (validationError) {
    // Handle unexpected validation errors
    console.error('Validation middleware error:', validationError);
    return res.status(500).json({
      error: 'Internal validation error',
      message: 'An unexpected error occurred during validation',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to validate the secureChatGPT request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateSecureChatGPTRequest = (req, res, next) => {
  try {
    // Validate the request body against the schema
    const { error, value } = secureChatGPTRequestSchema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Format validation errors for better user experience
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    }

    // Replace req.body with the validated and sanitized data
    req.body = value;
    next();
  } catch (validationError) {
    // Handle unexpected validation errors
    console.error('Validation middleware error:', validationError);
    return res.status(500).json({
      error: 'Internal validation error',
      message: 'An unexpected error occurred during validation',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to validate the deanonymize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateDeanonymizeRequest = (req, res, next) => {
  try {
    // Validate the request body against the schema
    const { error, value } = deanonymizeRequestSchema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      // Format validation errors for better user experience
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: errorDetails,
        timestamp: new Date().toISOString()
      });
    }

    // Replace req.body with the validated and sanitized data
    req.body = value;
    next();
  } catch (validationError) {
    // Handle unexpected validation errors
    console.error('Validation middleware error:', validationError);
    return res.status(500).json({
      error: 'Internal validation error',
      message: 'An unexpected error occurred during validation',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  validateAnonymizeRequest,
  validateDeanonymizeRequest,
  validateSecureChatGPTRequest,
  anonymizeRequestSchema,
  deanonymizeRequestSchema,
  secureChatGPTRequestSchema
};

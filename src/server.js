const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('../config/db');
const { anonymizeMessage, deanonymizeMessage, getMappingStats } = require('./services/anonymizer');
const openaiService = require('./services/openaiService');
const { validateAnonymizeRequest, validateDeanonymizeRequest, validateSecureChatGPTRequest } = require('./middleware/validation');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await getMappingStats();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Data Privacy Vault - PII Anonymization API',
      database: 'Connected',
      mappings: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Data Privacy Vault - PII Anonymization API',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Main anonymization endpoint
app.post('/anonymize', validateAnonymizeRequest, async (req, res, next) => {
  try {
    const { message } = req.body;
    
    // Anonymize the message
    const anonymizedMessage = await anonymizeMessage(message);
    
    res.status(200).json({
      anonymizedMessage
    });
  } catch (error) {
    next(error);
  }
});

// Deanonymization endpoint
app.post('/deanonymize', validateDeanonymizeRequest, async (req, res, next) => {
  try {
    const { anonymizedMessage } = req.body;
    
    // Deanonymize the message
    const message = await deanonymizeMessage(anonymizedMessage);
    
    res.status(200).json({
      message
    });
  } catch (error) {
    next(error);
  }
});

// Secure ChatGPT endpoint
app.post('/secureChatGPT', validateSecureChatGPTRequest, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    
    console.log('🔒 Starting secure ChatGPT request...');
    console.log('📝 Original prompt:', prompt);
    
    // Step 1: Anonymize the prompt to protect PII
    console.log('📝 Anonymizing prompt...');
    const anonymizedPrompt = await anonymizeMessage(prompt);
    console.log('✅ Prompt anonymized');
    console.log('🔒 Anonymized prompt:', anonymizedPrompt);
    
    // Step 2: Send anonymized prompt to OpenAI
    console.log('🤖 Sending request to OpenAI...');
    const anonymizedResponse = await openaiService.getCompletion(anonymizedPrompt);
    console.log('✅ Received response from OpenAI');
    console.log('🤖 Anonymized response from OpenAI:', anonymizedResponse);
    
    // Step 3: Deanonymize the response to restore original PII
    console.log('🔓 Deanonymizing response...');
    const finalResponse = await deanonymizeMessage(anonymizedResponse);
    console.log('✅ Response deanonymized');
    console.log('🔓 Final response:', finalResponse);
    
    res.status(200).json({
      response: finalResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Secure ChatGPT error:', error);
    next(error);
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: ['GET /health', 'POST /anonymize', 'POST /deanonymize', 'POST /secureChatGPT']
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Data Privacy Vault API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔒 Anonymize endpoint: http://localhost:${PORT}/anonymize`);
      console.log(`🔓 Deanonymize endpoint: http://localhost:${PORT}/deanonymize`);
      console.log(`🤖 Secure ChatGPT endpoint: http://localhost:${PORT}/secureChatGPT`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = app;

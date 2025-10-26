const OpenAI = require('openai');
require('dotenv').config();

/**
 * OpenAI Service Class
 * Handles secure communication with OpenAI API
 * Provides methods for text completion using GPT models
 */
class OpenAIService {
  constructor() {
    // Initialize OpenAI client with API key from environment
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Default model configuration
    this.defaultModel = 'gpt-4o-mini';
    this.maxTokens = 1000;
    this.temperature = 0.7;
  }

  /**
   * Get text completion from OpenAI
   * @param {string} prompt - The text prompt to send to OpenAI
   * @param {Object} options - Optional configuration overrides
   * @returns {Promise<string>} The completion text from OpenAI
   */
  async getCompletion(prompt, options = {}) {
    try {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }

      // Validate prompt
      if (!prompt || typeof prompt !== 'string') {
        throw new Error('Prompt must be a non-empty string');
      }

      // Merge default options with provided options
      const completionOptions = {
        model: options.model || this.defaultModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        ...options
      };

      console.log(`🤖 Sending request to OpenAI with model: ${completionOptions.model}`);
      console.log(`📝 Prompt being sent to OpenAI:`, prompt);

      // Send request to OpenAI
      const completion = await this.openai.chat.completions.create(completionOptions);

      // Extract the response text
      const responseText = completion.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response received from OpenAI');
      }

      console.log(`✅ Received response from OpenAI (${completion.usage?.total_tokens || 'unknown'} tokens)`);

      return responseText;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      } else if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.type === 'server_error') {
        throw new Error('OpenAI server error. Please try again later.');
      }
      
      throw new Error(`OpenAI API request failed: ${error.message}`);
    }
  }

  /**
   * Get available models from OpenAI
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      const models = await this.openai.models.list();
      return models.data.map(model => ({
        id: model.id,
        owned_by: model.owned_by,
        created: model.created
      }));
    } catch (error) {
      console.error('Error fetching models:', error);
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  /**
   * Validate the OpenAI API key
   * @returns {Promise<boolean>} True if API key is valid
   */
  async validateApiKey() {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for the current API key
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      // Note: This requires a separate API call to OpenAI's usage endpoint
      // For now, we'll return a placeholder
      return {
        message: 'Usage statistics require additional OpenAI API calls',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw new Error(`Failed to fetch usage stats: ${error.message}`);
    }
  }
}

// Export a singleton instance
module.exports = new OpenAIService();

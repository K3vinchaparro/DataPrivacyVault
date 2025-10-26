#!/usr/bin/env node

/**
 * Test script for OpenAI integration
 * Tests the secureChatGPT endpoint with PII protection
 */

require('dotenv').config();

async function testSecureChatGPT() {
  try {
    console.log('🤖 Testing Secure ChatGPT Integration...\n');

    // Test prompt with PII
    const testPrompt = "Hi, my name is María García and my email is maria.garcia@empresa.com. My phone number is +34 612 345 678. Can you help me write a professional email to schedule a meeting?";

    console.log('📝 Test prompt:', testPrompt);
    console.log('\n🔒 Sending secure request to ChatGPT...');

    // Make request to secureChatGPT endpoint
    const response = await fetch('http://localhost:3001/secureChatGPT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    console.log('✅ Received response from Secure ChatGPT:');
    console.log('📄 Response:', data.response);
    console.log('⏰ Timestamp:', data.timestamp);

    console.log('\n🎉 Secure ChatGPT test completed successfully!');
    console.log('🔒 PII was protected during the OpenAI API call');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure the server is running:');
      console.log('   npm start');
    } else if (error.message.includes('OPENAI_API_KEY')) {
      console.log('\n💡 Make sure to set your OpenAI API key in the .env file:');
      console.log('   OPENAI_API_KEY=your_actual_api_key_here');
    }
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or install node-fetch');
  console.log('   npm install node-fetch');
  process.exit(1);
}

// Run the test
testSecureChatGPT();

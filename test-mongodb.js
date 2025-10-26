#!/usr/bin/env node

/**
 * Simple test script to verify MongoDB integration
 * Run this script to test the anonymization and deanonymization flow
 */

require('dotenv').config();
const connectDB = require('./config/db');
const { anonymizeMessage, deanonymizeMessage, clearTokenMappings } = require('./src/services/anonymizer');

async function testAnonymization() {
  try {
    console.log('🔄 Starting MongoDB integration test...\n');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Clear any existing mappings
    await clearTokenMappings();
    console.log('✅ Cleared existing mappings\n');

    // Test message
    const testMessage = 'oferta de trabajo para Pepito Perez con email pepito@gmail.com y teléfono 3211234567';
    console.log('📝 Original message:', testMessage);

    // Anonymize the message
    console.log('\n🔒 Anonymizing message...');
    const anonymizedMessage = await anonymizeMessage(testMessage);
    console.log('✅ Anonymized message:', anonymizedMessage);

    // Deanonymize the message
    console.log('\n🔓 Deanonymizing message...');
    const deanonymizedMessage = await deanonymizeMessage(anonymizedMessage);
    console.log('✅ Deanonymized message:', deanonymizedMessage);

    // Verify round-trip integrity
    const isMatch = testMessage === deanonymizedMessage;
    console.log(`\n🎯 Round-trip test: ${isMatch ? 'PASSED' : 'FAILED'}`);

    if (isMatch) {
      console.log('\n🎉 All tests passed! MongoDB integration is working correctly.');
    } else {
      console.log('\n❌ Test failed! Messages do not match.');
      console.log('Expected:', testMessage);
      console.log('Got:', deanonymizedMessage);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAnonymization();

const { anonymizeMessage, deanonymizeMessage, detectPII, clearTokenMappings } = require('../services/anonymizer');
const connectDB = require('../../config/db');

describe('PII Anonymization Service', () => {
  beforeAll(async () => {
    // Connect to MongoDB before running tests
    await connectDB();
  });

  beforeEach(async () => {
    // Clear token mappings before each test
    await clearTokenMappings();
  });

  describe('detectPII', () => {
    test('should detect email addresses', () => {
      const message = 'Contact me at john.doe@example.com for more info';
      const result = detectPII(message);
      
      expect(result.emails).toHaveLength(1);
      expect(result.emails[0].value).toBe('john.doe@example.com');
      expect(result.emails[0].type).toBe('email');
    });

    test('should detect phone numbers', () => {
      const message = 'Call me at 3211234567 or +1-555-123-4567';
      const result = detectPII(message);
      
      expect(result.phones).toHaveLength(2);
      expect(result.phones[0].value).toBe('3211234567');
      expect(result.phones[1].value).toBe('+1-555-123-4567');
    });

    test('should detect names', () => {
      const message = 'Hello John Smith, how are you?';
      const result = detectPII(message);
      
      expect(result.names).toHaveLength(2);
      expect(result.names[0].value).toBe('John');
      expect(result.names[1].value).toBe('Smith');
    });
  });

  describe('anonymizeMessage', () => {
    test('should anonymize the example message correctly', async () => {
      const message = 'oferta de trabajo para Pepito Perez con email pepito@gmail.com y teléfono 3211234567';
      const result = await anonymizeMessage(message);
      
      // Check that the result doesn't contain the original PII
      expect(result).not.toContain('Pepito');
      expect(result).not.toContain('Perez');
      expect(result).not.toContain('pepito@gmail.com');
      expect(result).not.toContain('3211234567');
      
      // Check that the structure is maintained
      expect(result).toContain('oferta de trabajo para');
      expect(result).toContain('con email');
      expect(result).toContain('y teléfono');
      
      // Check that tokens have the correct format (TYPE_token)
      const tokens = result.match(/\b(NAME|EMAIL|PHONE)_[a-z0-9]{8}\b/g);
      expect(tokens).toHaveLength(4); // 2 names + 1 email + 1 phone
    });

    test('should handle messages without PII', async () => {
      const message = 'This is a normal message without any personal information';
      const result = await anonymizeMessage(message);
      
      expect(result).toBe(message);
    });

    test('should handle empty messages', async () => {
      const message = '';
      const result = await anonymizeMessage(message);
      
      expect(result).toBe('');
    });

    test('should throw error for invalid input', async () => {
      await expect(anonymizeMessage(null)).rejects.toThrow('Invalid message');
      await expect(anonymizeMessage(123)).rejects.toThrow('Invalid message');
    });
  });

  describe('deanonymizeMessage', () => {
    test('should deanonymize tokens back to original values', async () => {
      const originalMessage = 'oferta de trabajo para Pepito Perez con email pepito@gmail.com y teléfono 3211234567';
      
      // First anonymize the message
      const anonymizedMessage = await anonymizeMessage(originalMessage);
      
      // Then deanonymize it back
      const deanonymizedMessage = await deanonymizeMessage(anonymizedMessage);
      
      // Should match the original message
      expect(deanonymizedMessage).toBe(originalMessage);
    });

    test('should handle messages without tokens', async () => {
      const message = 'This is a normal message without any tokens';
      const result = await deanonymizeMessage(message);
      
      expect(result).toBe(message);
    });

    test('should handle unknown tokens gracefully', async () => {
      const message = 'Hello NAME_unknown123 and EMAIL_fake456';
      const result = await deanonymizeMessage(message);
      
      // Should keep unknown tokens as-is
      expect(result).toBe(message);
    });

    test('should throw error for invalid input', async () => {
      await expect(deanonymizeMessage(null)).rejects.toThrow('Invalid anonymized message');
      await expect(deanonymizeMessage(123)).rejects.toThrow('Invalid anonymized message');
    });
  });

  describe('round-trip anonymization', () => {
    test('should maintain data integrity through anonymize-deanonymize cycle', async () => {
      const testCases = [
        'Contact John Smith at john.smith@example.com or call 555-123-4567',
        'María García, email: maria.garcia@empresa.com, tel: +34 612 345 678',
        'Dr. Robert Johnson PhD, robert.johnson@university.edu, (555) 987-6543'
      ];

      for (const originalMessage of testCases) {
        const anonymized = await anonymizeMessage(originalMessage);
        const deanonymized = await deanonymizeMessage(anonymized);
        
        expect(deanonymized).toBe(originalMessage);
      }
    });
  });
});

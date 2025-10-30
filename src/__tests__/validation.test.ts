import { validateTelegramMessage, validateBotConfig, sanitizeText } from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateTelegramMessage', () => {
    it('should validate a correct message', () => {
      const message = {
        message_id: 1,
        date: 1640995200,
        chat: {
          id: 12345,
          type: 'private',
          first_name: 'John',
        },
        text: 'Hello',
      };

      const { error } = validateTelegramMessage(message);
      expect(error).toBeUndefined();
    });

    it('should reject message with invalid structure', () => {
      const message = {
        // missing required fields
      };

      const { error } = validateTelegramMessage(message);
      expect(error).toBeDefined();
    });
  });

  describe('validateBotConfig', () => {
    it('should validate correct bot config', () => {
      const config = {
        token: '123456789:ABCDEFabcdef1234567890ABCDEF123456789',
        username: 'test_bot',
      };

      const { error } = validateBotConfig(config);
      expect(error).toBeUndefined();
    });

    it('should reject invalid token format', () => {
      const config = {
        token: 'invalid-token',
        username: 'test_bot',
      };

      const { error } = validateBotConfig(config);
      expect(error).toBeDefined();
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeText('<script>alert("xss")</script>Hello');
      expect(result).toBe('alert("xss")Hello');
    });

    it('should remove javascript protocol', () => {
      const result = sanitizeText('javascript:alert("xss")');
      expect(result).toBe('alert("xss")');
    });

    it('should limit text length', () => {
      const longText = 'a'.repeat(5000);
      const result = sanitizeText(longText);
      expect(result.length).toBe(4096);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { validate, commonRules, validateField } from '@/shared/lib/validator';

describe('Validator', () => {
  describe('validateField', () => {
    it('should validate required field', () => {
      const error = validateField('', [commonRules.required('Field is required')]);
      expect(error).toBe('Field is required');
    });

    it('should validate minLength', () => {
      const error = validateField('ab', [commonRules.minLength(3)]);
      expect(error).toBe('Minimum length is 3 characters');
    });

    it('should validate maxLength', () => {
      const error = validateField('abcdef', [commonRules.maxLength(5)]);
      expect(error).toBe('Maximum length is 5 characters');
    });

    it('should validate email', () => {
      const error = validateField('invalid-email', [commonRules.email()]);
      expect(error).toBe('Invalid email address');
    });

    it('should validate valid email', () => {
      const error = validateField('test@example.com', [commonRules.email()]);
      expect(error).toBeNull();
    });

    it('should validate oneOf', () => {
      const error = validateField('invalid', [commonRules.oneOf(['a', 'b', 'c'], 'Must be a, b, or c')]);
      expect(error).toBe('Must be a, b, or c');
    });

    it('should validate oneOf with valid value', () => {
      const error = validateField('a', [commonRules.oneOf(['a', 'b', 'c'], 'Must be a, b, or c')]);
      expect(error).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate multiple fields', () => {
      const result = validate(
        { name: '', email: 'invalid' },
        [
          { field: 'name', rules: [commonRules.required()] },
          { field: 'email', rules: [commonRules.email()] },
        ]
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should pass validation when all fields valid', () => {
      const result = validate(
        { name: 'John', email: 'john@example.com' },
        [
          { field: 'name', rules: [commonRules.required()] },
          { field: 'email', rules: [commonRules.email()] },
        ]
      );

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
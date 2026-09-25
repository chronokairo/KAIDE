export interface ValidationRule {
  field: string;
  rules: FieldRule[];
}

export interface FieldRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'oneOf' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export function validateField(
  value: any,
  rules: FieldRule[]
): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message;
        }
        break;
      
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message;
        }
        break;
      
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message;
        }
        break;
      
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message;
        }
        break;
      
      case 'email':
        if (
          typeof value === 'string' &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          return rule.message;
        }
        break;
      
      case 'url':
        try {
          if (typeof value === 'string') {
            new URL(value);
          }
        } catch {
          return rule.message;
        }
        break;
      
      case 'oneOf':
        if (!rule.value.includes(value)) {
          return rule.message;
        }
        break;
      
      case 'custom':
        if (typeof rule.value === 'function' && !rule.value(value)) {
          return rule.message;
        }
        break;
    }
  }
  
  return null;
}

export function validate(
  data: Record<string, any>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];
  
  for (const rule of rules) {
    const value = data[rule.field];
    const error = validateField(value, rule.rules);
    
    if (error) {
      errors.push({
        field: rule.field,
        message: error,
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createValidator(rules: ValidationRule[]) {
  return (data: Record<string, any>): ValidationResult => validate(data, rules);
}

export const commonRules = {
  required: (message = 'This field is required'): FieldRule => ({
    type: 'required',
    message,
  }),
  
  minLength: (length: number, message?: string): FieldRule => ({
    type: 'minLength',
    value: length,
    message: message || `Minimum length is ${length} characters`,
  }),
  
  maxLength: (length: number, message?: string): FieldRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Maximum length is ${length} characters`,
  }),
  
  email: (message = 'Invalid email address'): FieldRule => ({
    type: 'email',
    message,
  }),
  
  url: (message = 'Invalid URL'): FieldRule => ({
    type: 'url',
    message,
  }),
  
  pattern: (regex: RegExp, message: string): FieldRule => ({
    type: 'pattern',
    value: regex.source,
    message,
  }),
  
  oneOf: (values: any[], message: string): FieldRule => ({
    type: 'oneOf',
    value: values,
    message,
  }),
};
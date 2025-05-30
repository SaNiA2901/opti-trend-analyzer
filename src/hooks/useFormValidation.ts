
import { useState, useCallback } from 'react';

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useFormValidation = <T extends Record<string, any>>(
  rules: ValidationRule<T>[]
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;
    
    return rule.validator(value) ? null : rule.message;
  }, [rules]);

  const validateForm = useCallback((data: T): ValidationResult => {
    const newErrors: Record<string, string> = {};
    
    rules.forEach(rule => {
      const error = validateField(rule.field, data[rule.field]);
      if (error) {
        newErrors[rule.field as string] = error;
      }
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  }, [rules, validateField]);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const { [field as string]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    errors,
    validateForm,
    validateField,
    clearFieldError,
    setErrors
  };
};

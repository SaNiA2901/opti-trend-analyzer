
import { useState } from 'react';

export interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = (message: string, code?: string) => {
    const error: ErrorState = {
      message,
      code,
      timestamp: new Date()
    };
    setErrors(prev => [...prev, error]);
    console.error('Application Error:', error);
  };

  const clearError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Произошла ошибка'
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      addError(message);
      return null;
    }
  };

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    handleAsyncError
  };
};

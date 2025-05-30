
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = useCallback((message: string, code?: string) => {
    const error: ErrorState = {
      message,
      code,
      timestamp: new Date()
    };
    setErrors(prev => [...prev, error]);
    
    // Показываем toast уведомление
    toast.error(message);
    console.error('Application Error:', error);
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleAsyncError = useCallback(async <T>(
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
  }, [addError]);

  const withErrorBoundary = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    errorMessage?: string
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : (errorMessage || 'Произошла ошибка');
        addError(message);
        return null;
      }
    };
  }, [addError]);

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    handleAsyncError,
    withErrorBoundary
  };
};

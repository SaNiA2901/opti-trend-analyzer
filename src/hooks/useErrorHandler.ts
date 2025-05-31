
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
  source?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  source?: string;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = useCallback((
    message: string, 
    code?: string, 
    options: ErrorHandlerOptions = {}
  ) => {
    const { showToast = true, logToConsole = true, source } = options;
    
    const error: ErrorState = {
      message,
      code,
      timestamp: new Date(),
      source
    };
    
    setErrors(prev => [...prev, error]);
    
    if (showToast) {
      toast.error(message);
    }
    
    if (logToConsole) {
      console.error('Application Error:', error);
    }
  }, []);

  const clearError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearErrorsBySource = useCallback((source: string) => {
    setErrors(prev => prev.filter(error => error.source !== source));
  }, []);

  const handleAsyncError = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Произошла ошибка',
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      const code = error instanceof Error && 'code' in error ? error.code as string : undefined;
      
      addError(message, code, options);
      return null;
    }
  }, [addError]);

  const withErrorBoundary = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    errorMessage?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        const message = error instanceof Error ? error.message : (errorMessage || 'Произошла ошибка');
        const code = error instanceof Error && 'code' in error ? error.code as string : undefined;
        
        addError(message, code, options);
        return null;
      }
    };
  }, [addError]);

  const handleSyncError = useCallback((
    error: unknown,
    fallbackMessage: string = 'Произошла ошибка',
    options: ErrorHandlerOptions = {}
  ) => {
    const message = error instanceof Error ? error.message : fallbackMessage;
    const code = error instanceof Error && 'code' in error ? error.code as string : undefined;
    
    addError(message, code, options);
  }, [addError]);

  const getRecentErrors = useCallback((minutes: number = 5): ErrorState[] => {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return errors.filter(error => error.timestamp > cutoff);
  }, [errors]);

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    clearErrorsBySource,
    handleAsyncError,
    withErrorBoundary,
    handleSyncError,
    getRecentErrors
  };
};

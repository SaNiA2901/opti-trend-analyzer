
import { CandleData } from './useTradingSession';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const useCandleValidation = () => {
  const validateCandleData = (candleData: Omit<CandleData, 'id' | 'candle_datetime'>): ValidationResult => {
    const errors: string[] = [];
    
    if (!candleData.session_id) errors.push('Session ID is required');
    if (candleData.candle_index < 0) errors.push('Candle index must be non-negative');
    if (candleData.open <= 0) errors.push('Open price must be positive');
    if (candleData.high <= 0) errors.push('High price must be positive');
    if (candleData.low <= 0) errors.push('Low price must be positive');
    if (candleData.close <= 0) errors.push('Close price must be positive');
    if (candleData.volume < 0) errors.push('Volume must be non-negative');
    
    if (candleData.high < Math.max(candleData.open, candleData.close)) {
      errors.push('High must be >= max(open, close)');
    }
    if (candleData.low > Math.min(candleData.open, candleData.close)) {
      errors.push('Low must be <= min(open, close)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateFormData = (formData: {
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }): ValidationResult => {
    const errors: string[] = [];
    const open = parseFloat(formData.open);
    const high = parseFloat(formData.high);
    const low = parseFloat(formData.low);
    const close = parseFloat(formData.close);
    const volume = parseFloat(formData.volume);

    if (isNaN(open) || open <= 0) errors.push('Цена открытия должна быть положительным числом');
    if (isNaN(high) || high <= 0) errors.push('Максимальная цена должна быть положительным числом');
    if (isNaN(low) || low <= 0) errors.push('Минимальная цена должна быть положительным числом');
    if (isNaN(close) || close <= 0) errors.push('Цена закрытия должна быть положительным числом');
    if (isNaN(volume) || volume < 0) errors.push('Объем должен быть неотрицательным числом');

    if (!isNaN(high) && !isNaN(open) && !isNaN(close) && high < Math.max(open, close)) {
      errors.push('Максимум должен быть >= max(открытие, закрытие)');
    }
    if (!isNaN(low) && !isNaN(open) && !isNaN(close) && low > Math.min(open, close)) {
      errors.push('Минимум должен быть <= min(открытие, закрытие)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    validateCandleData,
    validateFormData
  };
};

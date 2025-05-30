
import { CandleData } from '@/hooks/useTradingSession';

export interface CandleValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCandleOHLC = (
  open: number,
  high: number,
  low: number,
  close: number
): CandleValidationResult => {
  const errors: string[] = [];

  // Проверка положительных значений
  if (open <= 0) errors.push('Цена открытия должна быть больше 0');
  if (high <= 0) errors.push('Максимальная цена должна быть больше 0');
  if (low <= 0) errors.push('Минимальная цена должна быть больше 0');
  if (close <= 0) errors.push('Цена закрытия должна быть больше 0');

  // Проверка логики OHLC
  if (high < Math.max(open, close)) {
    errors.push('Максимальная цена не может быть меньше цены открытия или закрытия');
  }
  if (low > Math.min(open, close)) {
    errors.push('Минимальная цена не может быть больше цены открытия или закрытия');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCandleData = (candleData: Partial<CandleData>): CandleValidationResult => {
  const errors: string[] = [];

  if (!candleData.open || !candleData.high || !candleData.low || !candleData.close) {
    errors.push('Все поля OHLC должны быть заполнены');
    return { isValid: false, errors };
  }

  if (!candleData.volume || candleData.volume < 0) {
    errors.push('Объем должен быть положительным числом');
  }

  const ohlcValidation = validateCandleOHLC(
    candleData.open,
    candleData.high,
    candleData.low,
    candleData.close
  );

  return {
    isValid: ohlcValidation.isValid && errors.length === 0,
    errors: [...errors, ...ohlcValidation.errors]
  };
};

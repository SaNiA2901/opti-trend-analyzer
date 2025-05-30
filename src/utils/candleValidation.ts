
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

  // Дополнительные проверки на разумность данных
  const maxPrice = Math.max(open, high, low, close);
  const minPrice = Math.min(open, high, low, close);
  
  if (maxPrice / minPrice > 100) {
    errors.push('Слишком большая разница между максимальной и минимальной ценой');
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

  // Проверка на максимальный объем (защита от ошибок ввода)
  if (candleData.volume && candleData.volume > 1000000000) {
    errors.push('Объем слишком большой (больше 1 млрд)');
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

export const validateFormData = (formData: {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}): CandleValidationResult => {
  const errors: string[] = [];
  
  // Проверка на пустые значения
  if (!formData.open.trim()) errors.push('Цена открытия не может быть пустой');
  if (!formData.high.trim()) errors.push('Максимальная цена не может быть пустой');
  if (!formData.low.trim()) errors.push('Минимальная цена не может быть пустой');
  if (!formData.close.trim()) errors.push('Цена закрытия не может быть пустой');
  if (!formData.volume.trim()) errors.push('Объем не может быть пустым');

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

export const sanitizeNumericInput = (value: string): string => {
  // Удаляем все символы кроме цифр, точки и запятой
  return value.replace(/[^0-9.,]/g, '').replace(',', '.');
};

export const formatPrice = (price: number, decimals: number = 5): string => {
  return price.toFixed(decimals);
};

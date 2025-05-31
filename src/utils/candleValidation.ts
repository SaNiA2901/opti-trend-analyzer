
import { CandleData } from '@/hooks/useTradingSession';

export interface CandleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export const validateCandleOHLC = (
  open: number,
  high: number,
  low: number,
  close: number
): CandleValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

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

  // Проверка на корректность high/low относительно open/close
  if (high < open) errors.push('Максимальная цена не может быть меньше цены открытия');
  if (high < close) errors.push('Максимальная цена не может быть меньше цены закрытия');
  if (low > open) errors.push('Минимальная цена не может быть больше цены открытия');
  if (low > close) errors.push('Минимальная цена не может быть больше цены закрытия');

  // Дополнительные проверки на разумность данных
  const maxPrice = Math.max(open, high, low, close);
  const minPrice = Math.min(open, high, low, close);
  
  if (maxPrice / minPrice > 100) {
    errors.push('Слишком большая разница между максимальной и минимальной ценой (>100x)');
  }

  // Предупреждения для подозрительных данных
  if (maxPrice / minPrice > 10) {
    warnings.push('Большая разница между максимальной и минимальной ценой (>10x)');
  }

  if (Math.abs(high - low) / Math.min(high, low) > 0.5) {
    warnings.push('Очень большой диапазон цен для одной свечи');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const validateCandleData = (candleData: Partial<CandleData>): CandleValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка обязательных полей
  if (typeof candleData.open !== 'number' || isNaN(candleData.open)) {
    errors.push('Цена открытия должна быть числом');
  }
  if (typeof candleData.high !== 'number' || isNaN(candleData.high)) {
    errors.push('Максимальная цена должна быть числом');
  }
  if (typeof candleData.low !== 'number' || isNaN(candleData.low)) {
    errors.push('Минимальная цена должна быть числом');
  }
  if (typeof candleData.close !== 'number' || isNaN(candleData.close)) {
    errors.push('Цена закрытия должна быть числом');
  }

  if (typeof candleData.volume !== 'number' || isNaN(candleData.volume) || candleData.volume < 0) {
    errors.push('Объем должен быть неотрицательным числом');
  }

  if (typeof candleData.candle_index !== 'number' || candleData.candle_index < 0) {
    errors.push('Индекс свечи должен быть неотрицательным числом');
  }

  // Если базовые проверки пройдены, проверяем OHLC логику
  if (errors.length === 0 && 
      typeof candleData.open === 'number' && 
      typeof candleData.high === 'number' && 
      typeof candleData.low === 'number' && 
      typeof candleData.close === 'number') {
    
    const ohlcValidation = validateCandleOHLC(
      candleData.open,
      candleData.high,
      candleData.low,
      candleData.close
    );
    
    errors.push(...ohlcValidation.errors);
    warnings.push(...(ohlcValidation.warnings || []));
  }

  // Проверка на максимальный объем (защита от ошибок ввода)
  if (candleData.volume && candleData.volume > 1000000000) {
    errors.push('Объем слишком большой (больше 1 млрд)');
  }

  // Предупреждение для очень маленького объема
  if (candleData.volume && candleData.volume < 1) {
    warnings.push('Очень маленький объем торгов');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
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
  const warnings: string[] = [];
  
  // Проверка на пустые значения
  if (!formData.open.trim()) errors.push('Цена открытия не может быть пустой');
  if (!formData.high.trim()) errors.push('Максимальная цена не может быть пустой');
  if (!formData.low.trim()) errors.push('Минимальная цена не может быть пустой');
  if (!formData.close.trim()) errors.push('Цена закрытия не может быть пустой');
  if (!formData.volume.trim()) errors.push('Объем не может быть пустым');

  // Если поля не пустые, парсим и проверяем
  if (errors.length === 0) {
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

    // Проверяем OHLC логику только если все числа валидны
    if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
      const ohlcValidation = validateCandleOHLC(open, high, low, close);
      errors.push(...ohlcValidation.errors);
      warnings.push(...(ohlcValidation.warnings || []));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeNumericInput = (value: string): string => {
  // Удаляем все символы кроме цифр, точки и запятой, заменяем запятую на точку
  let sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
  
  // Убираем лишние точки (оставляем только первую)
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return sanitized;
};

export const formatPrice = (price: number, decimals: number = 5): string => {
  if (isNaN(price)) return '0';
  return price.toFixed(decimals);
};

export const formatVolume = (volume: number): string => {
  if (isNaN(volume)) return '0';
  
  if (volume >= 1000000000) {
    return (volume / 1000000000).toFixed(1) + 'B';
  } else if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  }
  
  return volume.toString();
};

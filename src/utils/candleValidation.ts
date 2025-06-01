
import { 
  validateRequiredFields, 
  validateNumericValues, 
  validatePriceLogic, 
  validateVolumeLogic,
  validateSpread
} from './validation/candleValidationRules';

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface CandleNumericData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  session_id: string;
  candle_index: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Улучшенная функция для санитизации числового ввода
export const sanitizeNumericInput = (value: string): string => {
  if (!value) return '';
  
  // Убираем все символы кроме цифр, точки и минуса
  let sanitized = value.replace(/[^0-9.-]/g, '');
  
  // Обрабатываем множественные точки
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Обрабатываем множественные минусы (только в начале)
  const minusCount = (sanitized.match(/-/g) || []).length;
  if (minusCount > 1) {
    const hasLeadingMinus = sanitized.startsWith('-');
    sanitized = sanitized.replace(/-/g, '');
    if (hasLeadingMinus) {
      sanitized = '-' + sanitized;
    }
  }
  
  // Ограничиваем количество знаков после запятой
  if (sanitized.includes('.')) {
    const [integer, decimal] = sanitized.split('.');
    sanitized = integer + '.' + decimal.slice(0, 8); // Максимум 8 знаков после запятой
  }
  
  return sanitized;
};

export const validateFormData = (data: CandleFormData): ValidationResult => {
  let errors: string[] = [];
  let warnings: string[] = [];

  // Проверка обязательных полей
  errors = errors.concat(validateRequiredFields(data));
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Проверка числовых значений
  const numericErrors = validateNumericValues(data);
  errors = errors.concat(numericErrors);
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Преобразуем в числа для дальнейшей валидации
  const numericData = {
    open: parseFloat(data.open),
    high: parseFloat(data.high),
    low: parseFloat(data.low),
    close: parseFloat(data.close),
    volume: parseFloat(data.volume)
  };

  // Проверка логики цен
  const priceErrors = validatePriceLogic(numericData);
  errors = errors.concat(priceErrors);

  // Проверка логики объема (предупреждения)
  const volumeWarnings = validateVolumeLogic(numericData.volume);
  warnings = warnings.concat(volumeWarnings);

  // Проверка спреда (предупреждения)
  const spreadWarnings = validateSpread(numericData);
  warnings = warnings.concat(spreadWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

export const validateCandleData = (data: Omit<CandleNumericData, 'id' | 'candle_datetime'>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка обязательных полей
  if (!data.session_id?.trim()) {
    errors.push('ID сессии обязателен');
  }

  if (typeof data.candle_index !== 'number' || data.candle_index < 0 || !Number.isInteger(data.candle_index)) {
    errors.push('Индекс свечи должен быть неотрицательным целым числом');
  }

  // Проверка числовых значений с более строгими проверками
  const numericFields = [
    { field: 'open', name: 'Цена открытия', value: data.open },
    { field: 'high', name: 'Максимальная цена', value: data.high },
    { field: 'low', name: 'Минимальная цена', value: data.low },
    { field: 'close', name: 'Цена закрытия', value: data.close }
  ];

  numericFields.forEach(({ name, value }) => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0 || !isFinite(value)) {
      errors.push(`${name} должна быть положительным конечным числом`);
    }
  });

  if (typeof data.volume !== 'number' || isNaN(data.volume) || data.volume < 0 || !isFinite(data.volume)) {
    errors.push('Объем должен быть неотрицательным конечным числом');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Проверка логики цен
  const priceErrors = validatePriceLogic(data);
  errors.push(...priceErrors);

  // Проверка логики объема и спреда
  const volumeWarnings = validateVolumeLogic(data.volume);
  const spreadWarnings = validateSpread(data);
  warnings.push(...volumeWarnings, ...spreadWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

// Улучшенная функция для валидации сессии
export const validateSessionData = (sessionData: {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Проверка обязательных полей с более строгой валидацией
  if (!sessionData.session_name?.trim()) {
    errors.push('Название сессии обязательно');
  } else if (sessionData.session_name.trim().length < 2) {
    errors.push('Название сессии должно содержать минимум 2 символа');
  } else if (sessionData.session_name.trim().length > 100) {
    errors.push('Название сессии не должно превышать 100 символов');
  }

  if (!sessionData.pair?.trim()) {
    errors.push('Валютная пара обязательна');
  } else if (!/^[A-Z]{3}\/[A-Z]{3}$/.test(sessionData.pair.trim())) {
    errors.push('Валютная пара должна быть в формате XXX/YYY (например, EUR/USD)');
  }

  if (!sessionData.timeframe?.trim()) {
    errors.push('Таймфрейм обязателен');
  } else {
    const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
    if (!validTimeframes.includes(sessionData.timeframe.trim())) {
      errors.push(`Таймфрейм должен быть одним из: ${validTimeframes.join(', ')}`);
    }
  }

  // Проверка формата даты
  if (!sessionData.start_date?.trim()) {
    errors.push('Дата начала обязательна');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionData.start_date)) {
    errors.push('Дата должна быть в формате YYYY-MM-DD');
  } else {
    // Проверяем валидность даты
    const date = new Date(sessionData.start_date);
    if (isNaN(date.getTime())) {
      errors.push('Некорректная дата');
    } else if (date > new Date()) {
      errors.push('Дата не может быть в будущем');
    }
  }

  // Проверка формата времени
  if (!sessionData.start_time?.trim()) {
    errors.push('Время начала обязательно');
  } else if (!/^\d{2}:\d{2}(:\d{2})?$/.test(sessionData.start_time)) {
    errors.push('Время должно быть в формате HH:MM или HH:MM:SS');
  } else {
    // Проверяем валидность времени
    const timeParts = sessionData.start_time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
    
    if (hours < 0 || hours > 23) {
      errors.push('Часы должны быть от 00 до 23');
    }
    if (minutes < 0 || minutes > 59) {
      errors.push('Минуты должны быть от 00 до 59');
    }
    if (seconds < 0 || seconds > 59) {
      errors.push('Секунды должны быть от 00 до 59');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

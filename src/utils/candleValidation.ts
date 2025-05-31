
import { 
  validateRequiredFields, 
  validateNumericValues, 
  validatePriceLogic, 
  validateVolumeLogic 
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
  if (!data.session_id) {
    errors.push('ID сессии обязателен');
  }

  if (typeof data.candle_index !== 'number' || data.candle_index < 0) {
    errors.push('Индекс свечи должен быть неотрицательным числом');
  }

  // Проверка числовых значений
  if (typeof data.open !== 'number' || data.open <= 0) {
    errors.push('Цена открытия должна быть положительным числом');
  }
  if (typeof data.high !== 'number' || data.high <= 0) {
    errors.push('Максимальная цена должна быть положительным числом');
  }
  if (typeof data.low !== 'number' || data.low <= 0) {
    errors.push('Минимальная цена должна быть положительным числом');
  }
  if (typeof data.close !== 'number' || data.close <= 0) {
    errors.push('Цена закрытия должна быть положительным числом');
  }
  if (typeof data.volume !== 'number' || data.volume < 0) {
    errors.push('Объем должен быть неотрицательным числом');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Проверка логики цен
  const priceErrors = validatePriceLogic(data);
  errors.push(...priceErrors);

  // Проверка логики объема
  const volumeWarnings = validateVolumeLogic(data.volume);
  warnings.push(...volumeWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

// Функция для валидации сессии
export const validateSessionData = (sessionData: {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}): ValidationResult => {
  const errors: string[] = [];

  if (!sessionData.session_name?.trim()) {
    errors.push('Название сессии обязательно');
  }

  if (!sessionData.pair?.trim()) {
    errors.push('Валютная пара обязательна');
  }

  if (!sessionData.timeframe?.trim()) {
    errors.push('Таймфрейм обязателен');
  }

  if (!sessionData.start_date?.trim()) {
    errors.push('Дата начала обязательна');
  }

  if (!sessionData.start_time?.trim()) {
    errors.push('Время начала обязательно');
  }

  // Проверка формата даты
  if (sessionData.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(sessionData.start_date)) {
    errors.push('Дата должна быть в формате YYYY-MM-DD');
  }

  // Проверка формата времени
  if (sessionData.start_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(sessionData.start_time)) {
    errors.push('Время должно быть в формате HH:MM или HH:MM:SS');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

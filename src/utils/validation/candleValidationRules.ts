
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
}

export const validateRequiredFields = (data: CandleFormData): string[] => {
  const errors: string[] = [];
  
  if (!data.open.trim()) errors.push('Цена открытия обязательна');
  if (!data.high.trim()) errors.push('Максимальная цена обязательна');
  if (!data.low.trim()) errors.push('Минимальная цена обязательна');
  if (!data.close.trim()) errors.push('Цена закрытия обязательна');
  if (!data.volume.trim()) errors.push('Объем обязателен');
  
  return errors;
};

export const validateNumericValues = (data: CandleFormData): string[] => {
  const errors: string[] = [];
  
  const open = parseFloat(data.open);
  const high = parseFloat(data.high);
  const low = parseFloat(data.low);
  const close = parseFloat(data.close);
  const volume = parseFloat(data.volume);
  
  if (isNaN(open) || open <= 0) errors.push('Цена открытия должна быть положительным числом');
  if (isNaN(high) || high <= 0) errors.push('Максимальная цена должна быть положительным числом');
  if (isNaN(low) || low <= 0) errors.push('Минимальная цена должна быть положительным числом');
  if (isNaN(close) || close <= 0) errors.push('Цена закрытия должна быть положительным числом');
  if (isNaN(volume) || volume < 0) errors.push('Объем должен быть неотрицательным числом');
  
  return errors;
};

export const validatePriceLogic = (data: CandleNumericData): string[] => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // High должен быть максимальным
  if (data.high < Math.max(data.open, data.close)) {
    errors.push('Максимальная цена не может быть меньше цен открытия или закрытия');
  }
  
  // Low должен быть минимальным
  if (data.low > Math.min(data.open, data.close)) {
    errors.push('Минимальная цена не может быть больше цен открытия или закрытия');
  }
  
  // High должен быть >= Low
  if (data.high < data.low) {
    errors.push('Максимальная цена не может быть меньше минимальной');
  }
  
  // Предупреждения
  if (data.high === data.low) {
    warnings.push('Максимальная и минимальная цены равны (отсутствие волатильности)');
  }
  
  if (data.open === data.close) {
    warnings.push('Цены открытия и закрытия равны (doji-свеча)');
  }
  
  return errors;
};

export const validateVolumeLogic = (volume: number): string[] => {
  const warnings: string[] = [];
  
  if (volume === 0) {
    warnings.push('Объем равен нулю - возможно отсутствие торговой активности');
  }
  
  return warnings;
};


import { VALIDATION_CONSTANTS } from './validationConstants';

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
  
  if (!data.open?.trim()) errors.push('Цена открытия обязательна');
  if (!data.high?.trim()) errors.push('Максимальная цена обязательна');
  if (!data.low?.trim()) errors.push('Минимальная цена обязательна');
  if (!data.close?.trim()) errors.push('Цена закрытия обязательна');
  if (!data.volume?.trim()) errors.push('Объем обязателен');
  
  return errors;
};

export const validateNumericValues = (data: CandleFormData): string[] => {
  const errors: string[] = [];
  const { MIN_PRICE, MAX_PRICE, MIN_VOLUME, MAX_VOLUME } = VALIDATION_CONSTANTS;
  
  const open = parseFloat(data.open);
  const high = parseFloat(data.high);
  const low = parseFloat(data.low);
  const close = parseFloat(data.close);
  const volume = parseFloat(data.volume);
  
  if (isNaN(open) || open < MIN_PRICE || open > MAX_PRICE) {
    errors.push(`Цена открытия должна быть от ${MIN_PRICE} до ${MAX_PRICE}`);
  }
  
  if (isNaN(high) || high < MIN_PRICE || high > MAX_PRICE) {
    errors.push(`Максимальная цена должна быть от ${MIN_PRICE} до ${MAX_PRICE}`);
  }
  
  if (isNaN(low) || low < MIN_PRICE || low > MAX_PRICE) {
    errors.push(`Минимальная цена должна быть от ${MIN_PRICE} до ${MAX_PRICE}`);
  }
  
  if (isNaN(close) || close < MIN_PRICE || close > MAX_PRICE) {
    errors.push(`Цена закрытия должна быть от ${MIN_PRICE} до ${MAX_PRICE}`);
  }
  
  if (isNaN(volume) || volume < MIN_VOLUME || volume > MAX_VOLUME) {
    errors.push(`Объем должен быть от ${MIN_VOLUME} до ${MAX_VOLUME}`);
  }
  
  return errors;
};

export const validatePriceLogic = (data: CandleNumericData): string[] => {
  const errors: string[] = [];
  const { open, high, low, close } = data;
  const { PRICE_TOLERANCE } = VALIDATION_CONSTANTS;
  
  if (high < Math.max(open, close) - PRICE_TOLERANCE) {
    errors.push('Максимальная цена не может быть меньше цен открытия или закрытия');
  }
  
  if (low > Math.min(open, close) + PRICE_TOLERANCE) {
    errors.push('Минимальная цена не может быть больше цен открытия или закрытия');
  }
  
  if (high < low - PRICE_TOLERANCE) {
    errors.push('Максимальная цена не может быть меньше минимальной');
  }
  
  return errors;
};

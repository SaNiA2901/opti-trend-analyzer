import { useState, useCallback, useMemo } from 'react';
import { CandleData } from '@/types/session';
import { validateCandleData } from '@/utils/candleValidation';

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  timestamp: string;
  spread?: string;
}

interface CandleFormState {
  formData: CandleFormData;
  errors: Partial<Record<keyof CandleFormData, string>>;
  isValid: boolean;
  isSubmitting: boolean;
}

interface UseCandleFormProps {
  sessionId: string;
  candleIndex: number;
}

export const useCandleForm = ({ sessionId, candleIndex }: UseCandleFormProps) => {
  const [state, setState] = useState<CandleFormState>({
    formData: {
      open: '',
      high: '',
      low: '',
      close: '',
      volume: '',
      timestamp: new Date().toISOString().slice(0, 16), // datetime-local format
      spread: ''
    },
    errors: {},
    isValid: false,
    isSubmitting: false
  });

  // Валидация в реальном времени
  const validateField = useCallback((field: keyof CandleFormData, value: string) => {
    const errors: string[] = [];

    if (!value && ['open', 'high', 'low', 'close', 'volume'].includes(field)) {
      errors.push('Обязательное поле');
    }

    if (value && ['open', 'high', 'low', 'close', 'volume', 'spread'].includes(field)) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        errors.push('Должно быть положительное число');
      }
    }

    return errors[0] || '';
  }, []);

  // Валидация всей формы
  const validateForm = useCallback(() => {
    const { formData } = state;
    const errors: Partial<Record<keyof CandleFormData, string>> = {};

    // Валидация отдельных полей
    Object.keys(formData).forEach(key => {
      const field = key as keyof CandleFormData;
      const error = validateField(field, formData[field] || '');
      if (error) errors[field] = error;
    });

    // Валидация OHLC логики
    if (formData.open && formData.high && formData.low && formData.close) {
      const o = Number(formData.open);
      const h = Number(formData.high);
      const l = Number(formData.low);
      const c = Number(formData.close);

      if (h < Math.max(o, c)) {
        errors.high = 'High должен быть >= max(Open, Close)';
      }
      if (l > Math.min(o, c)) {
        errors.low = 'Low должен быть <= min(Open, Close)';
      }
      if (h < l) {
        errors.high = 'High должен быть >= Low';
      }
    }

    const isValid = Object.keys(errors).length === 0 && 
                   formData.open && formData.high && formData.low && 
                   formData.close && formData.volume;

    setState(prev => ({
      ...prev,
      errors,
      isValid: !!isValid
    }));

    return { errors, isValid: !!isValid };
  }, [state.formData, validateField]);

  // Обработка изменений полей
  const handleInputChange = useCallback((field: keyof CandleFormData, value: string) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      return {
        ...prev,
        formData: newFormData
      };
    });
  }, []);

  // Валидация в реальном времени
  const validateRealTime = useCallback(() => {
    validateForm();
  }, [validateForm]);

  // Автоматический расчет на основе OHLC
  const calculateFromOHLC = useCallback((open: number, high: number, low: number) => {
    // Простая логика для демонстрации
    const range = high - low;
    const close = open + (Math.random() - 0.5) * range * 0.8; // Случайное закрытие в пределах диапазона
    const volume = Math.floor(Math.random() * 10000) + 1000; // Случайный объем

    return {
      close: Math.max(low, Math.min(high, close)), // Убеждаемся что close в пределах диапазона
      volume
    };
  }, []);

  // Отправка формы
  const handleSubmit = useCallback(async (): Promise<CandleData | null> => {
    const { errors, isValid } = validateForm();
    
    if (!isValid) {
      return null;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const { formData } = state;
      
      const candleData: CandleData = {
        id: `${sessionId}-${candleIndex}`,
        session_id: sessionId,
        candle_index: candleIndex,
        open: Number(formData.open),
        high: Number(formData.high),
        low: Number(formData.low),
        close: Number(formData.close),
        volume: Number(formData.volume),
        
        created_at: new Date().toISOString(),
        spread: formData.spread ? Number(formData.spread) : undefined
      };

      // Дополнительная валидация через утилиту
      const validationResult = validateCandleData(candleData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      return candleData;
    } catch (error) {
      console.error('Ошибка при создании свечи:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state, sessionId, candleIndex, validateForm]);

  // Сброс формы
  const reset = useCallback(() => {
    setState({
      formData: {
        open: '',
        high: '',
        low: '',
        close: '',
        volume: '',
        timestamp: new Date().toISOString().slice(0, 16),
        spread: ''
      },
      errors: {},
      isValid: false,
      isSubmitting: false
    });
  }, []);

  return {
    formData: state.formData,
    errors: state.errors,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    handleInputChange,
    handleSubmit,
    reset,
    calculateFromOHLC,
    validateRealTime,
    validateForm
  };
};
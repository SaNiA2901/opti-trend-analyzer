
import { useState, useCallback, useMemo } from 'react';
import { validateFormData } from '@/utils/candleValidation';

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export const useCandleForm = () => {
  const [candleData, setCandleData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const parseNumber = useCallback((value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const updateField = useCallback((field: keyof CandleFormData, value: string) => {
    setCandleData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибки при изменении поля
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors.length]);

  const resetForm = useCallback((keepOpen: boolean = true) => {
    setCandleData(prev => ({
      open: keepOpen ? prev.close : '',
      high: '',
      low: '',
      close: '',
      volume: ''
    }));
    setValidationErrors([]);
  }, []);

  const validateForm = useCallback(() => {
    const validation = validateFormData(candleData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return false;
    }
    
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        console.warn('Validation warning:', warning);
      });
    }
    
    setValidationErrors([]);
    return true;
  }, [candleData]);

  const isFormValid = useMemo(() => {
    return Object.values(candleData).every(value => value.trim() !== '');
  }, [candleData]);

  const getNumericData = useCallback(() => ({
    open: parseNumber(candleData.open),
    high: parseNumber(candleData.high),
    low: parseNumber(candleData.low),
    close: parseNumber(candleData.close),
    volume: parseNumber(candleData.volume)
  }), [candleData, parseNumber]);

  return {
    candleData,
    setCandleData,
    validationErrors,
    setValidationErrors,
    updateField,
    resetForm,
    validateForm,
    isFormValid,
    getNumericData
  };
};

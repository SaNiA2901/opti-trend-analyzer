
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
  const [formData, setFormData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = useCallback((field: keyof CandleFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors.length]);

  const resetForm = useCallback((keepOpen: boolean = true) => {
    setFormData(prev => ({
      open: keepOpen ? prev.close : '',
      high: '',
      low: '',
      close: '',
      volume: ''
    }));
    setErrors([]);
  }, []);

  const validateForm = useCallback(() => {
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }
    
    setErrors([]);
    return true;
  }, [formData]);

  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => value.trim() !== '');
  }, [formData]);

  const getNumericData = useCallback(() => ({
    open: parseFloat(formData.open) || 0,
    high: parseFloat(formData.high) || 0,
    low: parseFloat(formData.low) || 0,
    close: parseFloat(formData.close) || 0,
    volume: parseFloat(formData.volume) || 0
  }), [formData]);

  return {
    formData,
    setFormData,
    errors,
    updateField,
    resetForm,
    validateForm,
    isFormValid,
    getNumericData
  };
};

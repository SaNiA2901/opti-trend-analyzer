
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import CandleInputHeader from './candle-input/CandleInputHeader';
import CandleInputForm from './candle-input/CandleInputForm';
import CandleInputValidation from './candle-input/CandleInputValidation';
import CandleInputActions from './candle-input/CandleInputActions';
import CandleInputStats from './candle-input/CandleInputStats';

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface OptimizedCandleInputProps {
  currentSession: TradingSession;
  candles: CandleData[];
  nextCandleIndex: number;
  pair: string;
  nextCandleTime: string;
  onSave: (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

const OptimizedCandleInput = ({ 
  currentSession,
  candles,
  nextCandleIndex,
  pair,
  nextCandleTime,
  onSave,
  onDeleteLast
}: OptimizedCandleInputProps) => {
  const [formData, setFormData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const lastCandle = candles.length > 0 
    ? candles.reduce((latest, current) => 
        current.candle_index > latest.candle_index ? current : latest
      )
    : null;

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !formData.open && !isSubmitting) {
      setFormData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
      }));
    }
  }, [lastCandle?.close, formData.open, isSubmitting]);

  const updateField = useCallback((field: keyof CandleFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors.length]);

  const validateForm = useCallback(() => {
    const newErrors: string[] = [];
    
    if (!formData.open || isNaN(Number(formData.open))) {
      newErrors.push('Цена открытия должна быть числом');
    }
    if (!formData.high || isNaN(Number(formData.high))) {
      newErrors.push('Максимальная цена должна быть числом');
    }
    if (!formData.low || isNaN(Number(formData.low))) {
      newErrors.push('Минимальная цена должна быть числом');
    }
    if (!formData.close || isNaN(Number(formData.close))) {
      newErrors.push('Цена закрытия должна быть числом');
    }
    if (!formData.volume || isNaN(Number(formData.volume))) {
      newErrors.push('Объем должен быть числом');
    }

    const open = Number(formData.open);
    const high = Number(formData.high);
    const low = Number(formData.low);
    const close = Number(formData.close);

    if (high < Math.max(open, close) || high < low) {
      newErrors.push('Максимальная цена должна быть выше или равна цене открытия, закрытия и минимуму');
    }
    if (low > Math.min(open, close) || low > high) {
      newErrors.push('Минимальная цена должна быть ниже или равна цене открытия, закрытия и максимуму');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const candleData = {
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        open: Number(formData.open),
        high: Number(formData.high),
        low: Number(formData.low),
        close: Number(formData.close),
        volume: Number(formData.volume)
      };

      await onSave(candleData);
      
      // Очищаем форму, оставляя цену закрытия как цену открытия для следующей свечи
      setFormData({
        open: formData.close,
        high: '',
        low: '',
        close: '',
        volume: ''
      });
    } catch (error) {
      console.error('Failed to save candle:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, currentSession.id, nextCandleIndex, onSave]);

  const handleDeleteLast = useCallback(async () => {
    if (lastCandle && window.confirm('Удалить последнюю свечу?')) {
      try {
        await onDeleteLast();
        setFormData({
          open: '',
          high: '',
          low: '',
          close: '',
          volume: ''
        });
      } catch (error) {
        console.error('Failed to delete last candle:', error);
      }
    }
  }, [lastCandle, onDeleteLast]);

  const isFormValid = Object.values(formData).every(value => value.trim() !== '') && errors.length === 0;

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <CandleInputHeader
        currentSession={currentSession}
        nextCandleIndex={nextCandleIndex}
        pair={pair}
        nextCandleTime={nextCandleTime}
      />

      <CandleInputForm
        formData={formData}
        onFieldChange={updateField}
        disabled={isSubmitting}
      />

      <CandleInputValidation
        errors={errors}
        isFormValid={isFormValid}
      />

      <CandleInputActions
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        lastCandle={lastCandle}
        onSave={handleSave}
        onDeleteLast={handleDeleteLast}
      />

      <CandleInputStats candles={candles} />
    </Card>
  );
};

export default OptimizedCandleInput;

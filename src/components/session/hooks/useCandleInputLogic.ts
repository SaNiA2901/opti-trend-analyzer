
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TradingSession, CandleData } from '@/types/session';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCandleForm } from './useCandleForm';

interface UseCandleInputLogicProps {
  currentSession: TradingSession | null;
  candles: CandleData[];
  nextCandleIndex: number;
  onSave: (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

export const useCandleInputLogic = ({
  currentSession,
  candles,
  nextCandleIndex,
  onSave,
  onDeleteLast
}: UseCandleInputLogicProps) => {
  const { addError } = useErrorHandler();
  const {
    candleData,
    validationErrors,
    updateField,
    resetForm,
    validateForm,
    isFormValid
  } = useCandleForm();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Мемоизированная последняя свеча
  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  // Обработчик сохранения
  const handleSave = useCallback(async () => {
    if (!currentSession) {
      const error = 'Нет активной сессии для сохранения данных';
      addError(error, undefined, { source: 'candle-input' });
      return;
    }

    if (!validateForm()) {
      console.warn('Form validation failed');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const candleFormData = {
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        open: parseFloat(candleData.open),
        high: parseFloat(candleData.high),
        low: parseFloat(candleData.low),
        close: parseFloat(candleData.close),
        volume: parseFloat(candleData.volume)
      };

      const savedCandle = await onSave(candleFormData);
      if (savedCandle) {
        resetForm();
        console.log('Candle saved successfully:', savedCandle.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      console.error('Save failed:', error);
      addError(errorMessage, undefined, { source: 'candle-input' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentSession, 
    validateForm, 
    candleData,
    nextCandleIndex, 
    onSave, 
    resetForm, 
    addError
  ]);

  // Обработчик удаления последней свечи
  const handleDeleteLast = useCallback(async () => {
    if (!currentSession || !lastCandle) {
      console.warn('Cannot delete - no session or last candle');
      return;
    }

    try {
      console.log('Deleting last candle:', lastCandle.candle_index);
      await onDeleteLast();
      resetForm();
      console.log('Last candle deleted successfully');
    } catch (error) {
      console.error('Error deleting last candle:', error);
      addError('Ошибка удаления последней свечи', undefined, { source: 'candle-input' });
    }
  }, [currentSession, lastCandle, onDeleteLast, addError, resetForm]);

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !candleData.open && !isSubmitting) {
      console.log('Auto-filling open price from last candle:', lastCandle.close);
      updateField('open', lastCandle.close.toString());
    }
  }, [lastCandle?.close, candleData.open, updateField, isSubmitting]);

  return {
    formData: candleData,
    errors: validationErrors,
    isSubmitting,
    isFormValid,
    lastCandle,
    updateField,
    handleSave,
    handleDeleteLast
  };
};

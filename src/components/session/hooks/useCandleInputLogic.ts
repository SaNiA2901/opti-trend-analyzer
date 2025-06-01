
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTradingSession, TradingSession, CandleData } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCandleForm } from './useCandleForm';

interface UseCandleInputLogicProps {
  currentSession: TradingSession | null;
  candles: CandleData[];
  nextCandleIndex: number;
  onCandleSaved: (candleData: any) => void;
}

export const useCandleInputLogic = ({
  currentSession,
  candles,
  nextCandleIndex,
  onCandleSaved
}: UseCandleInputLogicProps) => {
  const { 
    saveCandle, 
    getNextCandleTime, 
    deleteCandle
  } = useTradingSession();
  
  const { addError } = useErrorHandler();
  const {
    candleData,
    setCandleData,
    validationErrors,
    setValidationErrors,
    updateField,
    resetForm,
    validateForm,
    isFormValid,
    getNumericData
  } = useCandleForm();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Мемоизируем время следующей свечи
  const nextCandleTime = useMemo(() => {
    if (!currentSession) {
      console.log('useCandleInputLogic: No current session for time calculation');
      return '';
    }
    const time = getNextCandleTime(nextCandleIndex);
    console.log('useCandleInputLogic: Next candle time calculated:', time);
    return time;
  }, [currentSession, getNextCandleTime, nextCandleIndex]);

  // Мемоизируем последнюю свечу
  const lastCandle = useMemo(() => {
    const last = candles.length > 0 ? candles[candles.length - 1] : null;
    console.log('useCandleInputLogic: Last candle:', last?.candle_index || 'none');
    return last;
  }, [candles]);

  const handleSave = useCallback(async () => {
    if (!currentSession) {
      const error = 'Нет активной сессии для сохранения данных';
      setValidationErrors([error]);
      addError(error, undefined, { source: 'candle-input' });
      return;
    }

    if (!validateForm()) {
      console.log('useCandleInputLogic: Form validation failed');
      return;
    }

    const numericData = getNumericData();
    console.log('useCandleInputLogic: Saving candle with data:', numericData);

    setIsSubmitting(true);
    try {
      const savedCandle = await saveCandle({
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        ...numericData
      });

      if (savedCandle) {
        console.log('useCandleInputLogic: Candle saved successfully:', savedCandle);
        onCandleSaved(savedCandle);
        resetForm(true);
      }
    } catch (error) {
      console.error('useCandleInputLogic: Error saving candle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      setValidationErrors([errorMessage]);
      addError(errorMessage, undefined, { source: 'candle-input' });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSession, validateForm, getNumericData, nextCandleIndex, saveCandle, onCandleSaved, resetForm, addError, setValidationErrors]);

  const handleDeleteLastCandle = useCallback(async () => {
    if (!currentSession || !lastCandle) {
      console.warn('useCandleInputLogic: Cannot delete - no session or no candles');
      return;
    }

    try {
      console.log('useCandleInputLogic: Deleting last candle:', lastCandle.candle_index);
      await deleteCandle(lastCandle.candle_index);
      console.log('useCandleInputLogic: Last candle deleted successfully');
      resetForm(false);
    } catch (error) {
      console.error('useCandleInputLogic: Error deleting last candle:', error);
      addError('Ошибка удаления последней свечи', undefined, { source: 'candle-input' });
    }
  }, [currentSession, lastCandle, deleteCandle, addError, resetForm]);

  // Автозаполнение цены открытия на основе последней свечи
  useEffect(() => {
    if (lastCandle && !candleData.open) {
      console.log('useCandleInputLogic: Auto-filling open price from last candle:', lastCandle.close);
      setCandleData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
      }));
    }
  }, [lastCandle, candleData.open, setCandleData]);

  return {
    candleData,
    validationErrors,
    isSubmitting,
    isFormValid,
    nextCandleTime,
    lastCandle,
    updateField,
    handleSave,
    handleDeleteLastCandle
  };
};

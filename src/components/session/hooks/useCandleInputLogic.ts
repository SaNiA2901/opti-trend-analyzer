
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

  // Мемоизированное время следующей свечи
  const nextCandleTime = useMemo(() => {
    if (!currentSession || !getNextCandleTime) return '';
    try {
      return getNextCandleTime(nextCandleIndex);
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  }, [currentSession?.id, getNextCandleTime, nextCandleIndex]);

  // Мемоизированная последняя свеча
  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  const handleSave = useCallback(async () => {
    if (!currentSession) {
      const error = 'Нет активной сессии для сохранения данных';
      setValidationErrors([error]);
      addError(error, undefined, { source: 'candle-input' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    const numericData = getNumericData();
    setIsSubmitting(true);
    
    try {
      const savedCandle = await saveCandle({
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        ...numericData
      });

      if (savedCandle) {
        onCandleSaved(savedCandle);
        resetForm(true);
        console.log('Candle saved successfully:', savedCandle.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      setValidationErrors([errorMessage]);
      addError(errorMessage, undefined, { source: 'candle-input' });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSession, validateForm, getNumericData, nextCandleIndex, saveCandle, onCandleSaved, resetForm, addError, setValidationErrors]);

  const handleDeleteLastCandle = useCallback(async () => {
    if (!currentSession || !lastCandle) {
      return;
    }

    try {
      await deleteCandle(lastCandle.candle_index);
      resetForm(false);
      console.log('Last candle deleted successfully');
    } catch (error) {
      console.error('Error deleting last candle:', error);
      addError('Ошибка удаления последней свечи', undefined, { source: 'candle-input' });
    }
  }, [currentSession, lastCandle, deleteCandle, addError, resetForm]);

  // Автозаполнение цены открытия на основе последней свечи
  useEffect(() => {
    if (lastCandle && !candleData.open) {
      setCandleData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
      }));
    }
  }, [lastCandle?.close, candleData.open, setCandleData]);

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

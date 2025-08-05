
import { useEffect, useMemo, useCallback } from 'react';
import { TradingSession, CandleData } from '@/types/session';
import { useCandleForm } from './useCandleForm';
import { useCandleActions } from './useCandleActions';

interface UseCandleInputLogicProps {
  currentSession: TradingSession | null;
  candles: CandleData[];
  nextCandleIndex: number;
  onSave: (candleData: any) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

export const useCandleInputLogic = ({
  currentSession,
  candles,
  nextCandleIndex,
  onSave,
  onDeleteLast
}: UseCandleInputLogicProps) => {
  const {
    formData,
    errors,
    isValid,
    isSubmitting: formSubmitting,
    handleInputChange,
    handleSubmit,
    reset,
    validateForm
  } = useCandleForm({
    sessionId: currentSession?.id || '',
    candleIndex: nextCandleIndex
  });

  const isSubmitting = formSubmitting;

  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  // Мемоизируем обработчики для предотвращения повторных рендеров
  const handleSave = useCallback(async () => {
    try {
      const candleData = await handleSubmit();
      if (candleData) {
        await onSave(candleData);
        reset();
      }
    } catch (error) {
      console.error('Error saving candle:', error);
    }
  }, [handleSubmit, onSave, reset]);

  const handleDeleteLast = useCallback(async () => {
    if (lastCandle && window.confirm('Удалить последнюю свечу?')) {
      await onDeleteLast();
    }
  }, [lastCandle, onDeleteLast]);

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !formData.open && !isSubmitting) {
      handleInputChange('open', lastCandle.close.toString());
    }
  }, [lastCandle?.close, formData.open, handleInputChange, isSubmitting]);

  return {
    formData,
    errors,
    isSubmitting,
    isFormValid: isValid,
    lastCandle,
    updateField: handleInputChange,
    handleSave,
    handleDeleteLast
  };
};

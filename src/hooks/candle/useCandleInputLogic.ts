
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
    updateField,
    resetForm,
    validateForm,
    isFormValid,
    getNumericData
  } = useCandleForm();

  const {
    isSubmitting,
    handleSave: saveAction,
    handleDeleteLast: deleteAction
  } = useCandleActions({
    currentSession,
    nextCandleIndex,
    onSave,
    onDeleteLast
  });

  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  // Мемоизируем обработчики для предотвращения повторных рендеров
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    const numericData = getNumericData();
    await saveAction(numericData, resetForm);
  }, [validateForm, getNumericData, saveAction, resetForm]);

  const handleDeleteLast = useCallback(async () => {
    if (lastCandle && window.confirm('Удалить последнюю свечу?')) {
      await deleteAction(resetForm);
    }
  }, [lastCandle, deleteAction, resetForm]);

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !formData.open && !isSubmitting) {
      updateField('open', lastCandle.close.toString());
    }
  }, [lastCandle?.close, formData.open, updateField, isSubmitting]);

  return {
    formData,
    errors,
    isSubmitting,
    isFormValid,
    lastCandle,
    updateField,
    handleSave,
    handleDeleteLast
  };
};

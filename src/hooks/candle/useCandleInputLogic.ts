
import { useEffect, useMemo } from 'react';
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

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !formData.open && !isSubmitting) {
      updateField('open', lastCandle.close.toString());
    }
  }, [lastCandle?.close, formData.open, updateField, isSubmitting]);

  const handleSave = async () => {
    if (!validateForm()) return;
    
    const numericData = getNumericData();
    await saveAction(numericData, resetForm);
  };

  const handleDeleteLast = async () => {
    if (lastCandle && window.confirm('Удалить последнюю свечу?')) {
      await deleteAction(resetForm);
    }
  };

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


import { useState, useCallback } from 'react';
import { TradingSession, CandleData } from '@/types/session';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface UseCandleActionsProps {
  currentSession: TradingSession | null;
  nextCandleIndex: number;
  onSave: (candleData: any) => Promise<CandleData>;
  onDeleteLast: () => Promise<void>;
}

export const useCandleActions = ({
  currentSession,
  nextCandleIndex,
  onSave,
  onDeleteLast
}: UseCandleActionsProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addError } = useErrorHandler();

  const handleSave = useCallback(async (formData: any, resetForm: () => void) => {
    if (!currentSession) {
      addError('Нет активной сессии для сохранения данных');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const candleData = {
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        open: formData.open,
        high: formData.high,
        low: formData.low,
        close: formData.close,
        volume: formData.volume
      };

      const savedCandle = await onSave(candleData);
      if (savedCandle) {
        resetForm();
        console.log('Candle saved successfully:', savedCandle.id);
      }
    } catch (error) {
      console.error('Save failed:', error);
      addError(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSession, nextCandleIndex, onSave, addError]);

  const handleDeleteLast = useCallback(async (resetForm: () => void) => {
    if (!currentSession) {
      console.warn('Cannot delete - no session');
      return;
    }

    try {
      await onDeleteLast();
      resetForm();
      console.log('Last candle deleted successfully');
    } catch (error) {
      console.error('Error deleting last candle:', error);
      addError('Ошибка удаления последней свечи');
    }
  }, [currentSession, onDeleteLast, addError]);

  return {
    isSubmitting,
    handleSave,
    handleDeleteLast
  };
};

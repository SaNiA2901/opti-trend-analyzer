
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useCandleForm } from './hooks/useCandleForm';
import CandleInputHeader from './CandleInputHeader';
import CandleInputForm from './CandleInputForm';
import CandleInputFooter from './CandleInputFooter';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

const CandleInput = ({ pair, onCandleSaved }: CandleInputProps) => {
  const { 
    currentSession, 
    candles, 
    saveCandle, 
    getNextCandleTime, 
    nextCandleIndex,
    sessionStats,
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
    return currentSession ? getNextCandleTime(nextCandleIndex) : '';
  }, [currentSession, getNextCandleTime, nextCandleIndex]);

  // Мемоизируем последнюю свечу
  const lastCandle = useMemo(() => {
    return candles.length > 0 ? candles[candles.length - 1] : null;
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
        console.log('Candle saved successfully:', savedCandle);
        onCandleSaved(savedCandle);
        resetForm(true);
      }
    } catch (error) {
      console.error('Error saving candle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      setValidationErrors([errorMessage]);
      addError(errorMessage, undefined, { source: 'candle-input' });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSession, validateForm, getNumericData, nextCandleIndex, saveCandle, onCandleSaved, resetForm, addError, setValidationErrors]);

  const handleDeleteLastCandle = useCallback(async () => {
    if (!currentSession || !lastCandle) {
      console.warn('Cannot delete: no session or no candles');
      return;
    }

    try {
      await deleteCandle(lastCandle.candle_index);
      console.log('Last candle deleted successfully');
      resetForm(false);
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
  }, [lastCandle, candleData.open, setCandleData]);

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <CandleInputHeader
        nextCandleIndex={nextCandleIndex}
        currentSession={currentSession}
        nextCandleTime={nextCandleTime}
        pair={pair}
        sessionStats={sessionStats}
      />

      <CandleInputForm
        candleData={candleData}
        onFieldChange={updateField}
        isDisabled={!currentSession}
        pair={pair}
      />

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
          <ul className="text-red-200 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <CandleInputFooter
        currentSession={currentSession}
        isValid={isFormValid}
        isSubmitting={isSubmitting}
        onSave={handleSave}
        candles={candles}
        onDeleteLastCandle={handleDeleteLastCandle}
        lastCandle={lastCandle}
      />
    </Card>
  );
};

export default CandleInput;

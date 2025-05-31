
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTradingSession } from '@/hooks/useTradingSession';
import { validateFormData } from '@/utils/candleValidation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import CandleInputHeader from './CandleInputHeader';
import CandleInputForm from './CandleInputForm';
import CandleInputFooter from './CandleInputFooter';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
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
  
  const [candleData, setCandleData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Мемоизируем время следующей свечи
  const nextCandleTime = useMemo(() => {
    return currentSession ? getNextCandleTime(nextCandleIndex) : '';
  }, [currentSession, getNextCandleTime, nextCandleIndex]);

  // Мемоизируем последнюю свечу
  const lastCandle = useMemo(() => {
    return candles.length > 0 ? candles[candles.length - 1] : null;
  }, [candles]);

  const parseNumber = useCallback((value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const updateField = useCallback((field: string, value: string) => {
    setCandleData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Очищаем ошибки валидации при изменении полей
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors.length]);

  const resetForm = useCallback((keepOpen: boolean = true) => {
    setCandleData({
      open: keepOpen ? candleData.close : '',
      high: '',
      low: '',
      close: '',
      volume: ''
    });
    setValidationErrors([]);
  }, [candleData.close]);

  const handleSave = useCallback(async () => {
    if (!currentSession) {
      const error = 'Нет активной сессии для сохранения данных';
      setValidationErrors([error]);
      addError(error, undefined, { source: 'candle-input' });
      return;
    }

    // Валидация формы
    const validation = validateFormData(candleData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      console.log('Validation errors:', validation.errors);
      return;
    }

    // Показываем предупреждения, если есть
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        console.warn('Validation warning:', warning);
      });
    }

    const numericData = {
      open: parseNumber(candleData.open),
      high: parseNumber(candleData.high),
      low: parseNumber(candleData.low),
      close: parseNumber(candleData.close),
      volume: parseNumber(candleData.volume)
    };

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
        
        // Автозаполнение следующей свечи
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
  }, [currentSession, candleData, nextCandleIndex, saveCandle, onCandleSaved, parseNumber, addError, resetForm]);

  const handleDeleteLastCandle = useCallback(async () => {
    if (!currentSession || !lastCandle) {
      console.warn('Cannot delete: no session or no candles');
      return;
    }

    try {
      await deleteCandle(lastCandle.candle_index);
      console.log('Last candle deleted successfully');
      
      // Очищаем форму при удалении последней свечи
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
  }, [lastCandle, candleData.open]);

  // Мемоизируем проверку валидности формы
  const isFormValid = useMemo(() => {
    return Object.values(candleData).every(value => value.trim() !== '');
  }, [candleData]);

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
